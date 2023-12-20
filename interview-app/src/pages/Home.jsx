import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="content">
        <div>
          <h2>Welcome to the Mock Interview</h2>
        </div>
        <div className="link-container">
          <div className="link-box">
            <Link to="/pre-interview" className="link">
              Start Pre-Interview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
