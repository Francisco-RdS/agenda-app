// src/Login.jsx
import React from 'react';
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase"; 

export default function Login() { // Removida a prop onLogin, pois não estava sendo usada no App.jsx
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Adicionado para feedback visual

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro(""); // Limpa erros antigos

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // Não precisamos mais do onLogin(), pois o App.jsx já detecta a mudança com onAuthStateChanged
    } catch (error) {
      // ===== AQUI ESTÁ A MUDANÇA IMPORTANTE =====
      // Mostramos o erro detalhado no console para depuração
      console.error("ERRO DETALHADO NO LOGIN:", error); 
      // Mostramos uma mensagem mais útil para o usuário
      setErro(`Erro: ${error.code}`); 
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="w-full p-2 border rounded mb-3"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}