import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/BharatForgeLimited.png";
import { loginUser } from "../services/api"; 

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const trimmedUsername = username.trim();
      const response = await loginUser({ username: trimmedUsername, password });
      const { token } = response.data;
      console.log(token);
      localStorage.setItem("authToken", token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-900 bg-opacity-80 rounded-lg p-10 shadow-xl w-96 text-center text-white font-sans">
        <div className="mb-6 flex flex-col items-center justify-center">
          <img src={logo} alt="BharatForgeLimited Logo" className="h-16 w-auto mb-4 object-contain" />
          <span className="text-xl tracking-widest font-extrabold mb-1 uppercase drop-shadow-lg">
            KALYANI
          </span>
        </div>
        <h1 className="font-bold text-2xl mb-1 drop-shadow-md">BharatForgeLimited</h1>
        <div className="text-base text-gray-300 mb-10 italic tracking-wide drop-shadow-sm">
          Tracker Application
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            className="w-full mb-5 px-5 py-3 rounded-lg focus:outline-none bg-gray-800 text-white placeholder-gray-500 shadow-inner transition duration-300"
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="w-full mb-5 px-5 py-3 rounded-lg focus:outline-none bg-gray-800 text-white placeholder-gray-500 shadow-inner transition duration-300"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="text-red-500 mb-4 font-semibold drop-shadow-md">{error}</div>
          )}
          <button
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 rounded-lg font-semibold transition duration-300 shadow-lg"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
