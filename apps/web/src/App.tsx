import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/app/providers/app-providers";
import { AppRoutes } from "@/app/routing/app-routes";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>
);

export default App;
