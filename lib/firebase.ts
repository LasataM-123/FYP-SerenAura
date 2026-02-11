import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD-uVFFn6BYQaCfztmJ0LeFHRAIVnLLeT0",
  authDomain: "serenaura-a5ba9.firebaseapp.com",
  projectId: "serenaura-a5ba9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
