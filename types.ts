import { StyleProp, TextStyle, ViewStyle, GestureResponderEvent, ImageSourcePropType, Image } from "react-native";

export interface CustomButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export interface CustomInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export type HeaderProps = {
  label: string;
  onBack?: () => void;
};

export type ButtonProps = {
  label: string;
  onPress: () => void;
  imageSource?: ImageSourcePropType; 
  width?: number;
  height?:number;
  textSize?:number;
  variant?: "solid" | "outline"; 
};

export interface OverlayProps {
  title: string;
  description:string;
  label: string;
  imageSource: ImageSourcePropType;
  includeOutlinedButton?:boolean;
  crossIcon?:boolean;
  outlineLabel?:string;
  onPress: () => void;
  onClose?: () => void;
}

export type AnswerCardProps = {
  item: { label: string; image: any };
  selectedAnswer: string | null;
  setSelectedAnswer: (label: string) => void;
};