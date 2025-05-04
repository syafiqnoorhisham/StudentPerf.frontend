import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import PerformanceList from './components/PerformanceList';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>Student Performance Dashboard</Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <PerformanceList />
      </Container>
      <footer className="footer mt-5">
        <Container className="text-center">
          <p className="text-muted">&copy; 2025 Student Performance Dashboard</p>
        </Container>
      </footer>
    </div>
  );
}

export default App;
