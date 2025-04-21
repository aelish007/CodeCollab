import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import EditorPage from "./pages/EditorPage";
import RejectionPage from "./pages/RejectionPage";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "../context/SettingsContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/editor/:roomId",
      element: <EditorPage />,
    },
    {
      path: "/rejection",
      element: <RejectionPage />,
    },
    {
      path: "*",
      element: <HomePage />,
    },
  ]);
  return (
    <div className="min-h-screen text-white min-w-screen bg-background font-Montserrat ">
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#3d404a",
            color: "white",
          },
        }}
      />
    </div>
  );
}

export default App;
