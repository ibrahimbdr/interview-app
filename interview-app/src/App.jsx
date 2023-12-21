import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PreInterview from "./pages/PreInterview";
import Header from "./components/Header";
// import Interview from "./pages/Interview";

function App() {

  return (
    <>
        <Header />
    <Router>
      <Routes>
          <Route exact path="/" element={<Home />} />
          <Route path="/pre-interview" element={<PreInterview />} />
          {/* <Route path="/interview" element={<Interview />} /> */}
      </Routes>
    </Router>
    </>
  );
}

export default App;
