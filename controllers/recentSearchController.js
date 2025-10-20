const asyncHandler = require('express-async-handler');
const RecentSearch = require('../models/recentSearchModel');
const Patient = require('../models/patientModel');

//@route POST /api/recent-search/add
//@desc Add recent search of the user
//access private (patient only)
const addRecentSearch = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const patientId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Find patient
    const patient = await Patient.findById(patientId).populate("recentSearch");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check for duplicate
    const duplicate = patient.recentSearch.find(
      (search) => search.content.toLowerCase() === content.toLowerCase()
    );
    if (duplicate) {
      return res.status(200).json({ message: "Search already exists", recentSearch: duplicate });
    }

    // Create new recent search
    const newSearch = await RecentSearch.create({
      patientId,
      content,
      entryDate: new Date(),
    });

    // Push to patient's recent searches array
    patient.recentSearch.push(newSearch._id);
    await patient.save();

    res.status(201).json({
      message: "Recent search added successfully",
      recentSearch: newSearch,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


//@route GET /api/recent-search/get
//@desc get recent searches of the patient
//@access private (patient only)
const getRecentSearches = asyncHandler(async (req, res) => {
    try{
        const patientId = req.user.id;
      
        const searches = await RecentSearch.find({ patientId })
          .sort({ entryDate: -1 })
          .limit(10);
      
        res.status(200).json(searches);

    }catch(err){
        return res.status(500).json({error:err.message});
    }
});

//@route DELETE /api/recent-search/delete/:id
//@desc delete recent search of the patient
//@access private (patient only)
const deleteRecentSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const search = await RecentSearch.findById(id);
  if (!search) {
    return res.status(404).json({ message: "Search not found" });
  }

  // Remove search reference from patient
  await Patient.findByIdAndUpdate(search.patientId, {
    $pull: { recentSearch: id }
  });

  // Delete search itself
  await search.deleteOne();

  res.status(200).json({ message: "Recent search deleted successfully" });
});

//@route GET /api/recent-search/suggest
//@desc Suggest recent searches
//@access private
const suggestRecentSearch = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user?.id;
    const query = req.query.query?.trim();

    if (!patientId) return res.status(401).json({ message: "Unauthorized" });
    if (!query) return res.status(400).json({ message: "Query is required" });

    // Only return searches for this user that start with the query
    const suggestions = await RecentSearch.find({
      patientId,
      content: { $regex: "^" + query, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error in suggestRecentSearch:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = {addRecentSearch, getRecentSearches, deleteRecentSearch, suggestRecentSearch}