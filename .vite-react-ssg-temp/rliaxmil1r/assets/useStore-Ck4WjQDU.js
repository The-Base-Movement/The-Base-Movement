import { useContext } from "react";
import { i as StoreContext } from "../main.mjs";
const useStore = () => {
  const context = useContext(StoreContext);
  if (context === void 0) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
export {
  useStore as u
};
