import { useState } from "react";
import "./App.css";

const LOGIN_URL =
  "https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate";
const MENSAJES_URL =
  "https://backcvbgtmdesa.azurewebsites.net/api/Mensajes";

function App() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // estado para la Serie II
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  // ============== SERIE I: LOGIN ==============
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessageStatus("");

    if (!username || !password) {
      setError("Llena usuario y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Username: username, // tal como lo pide el examen
          Password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const data = await response.json();

      const bearerToken =
        data.token ||
        data.Token ||
        data.accessToken ||
        data.access_token ||
        data.jwt;

      if (!bearerToken) {
        throw new Error("No se recibió el token del servidor.");
      }

      // Guardar en localStorage para usarlo en la Serie II
      localStorage.setItem("token", bearerToken);
      localStorage.setItem("username", username);

      setToken(bearerToken);
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken("");
    setUsername("");
    setPassword("");
    setMessage("");
    setMessageStatus("");
    setError("");
  };

  // ============== SERIE II: ENVIAR MENSAJE PROTEGIDO ==============
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError("");
    setMessageStatus("");

    if (!message.trim()) {
      setError("Escribe un mensaje antes de enviar.");
      return;
    }

    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) {
      setError("No hay token. Inicia sesión de nuevo.");
      return;
    }

    setLoading(true);

    try {
      // Por si el backend ya devuelve "Bearer xxx", evitamos duplicar el Bearer
      const authHeader = currentToken.startsWith("Bearer ")
        ? currentToken
        : `Bearer ${currentToken}`;

      const res = await fetch(MENSAJES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader, // <--- CRÍTICO Y OBLIGATORIO
        },
        body: JSON.stringify({
          Cod_Sala: 0,
          Login_Emisor: username, // tu usuario de la Serie I
          Contenido: message, // lo que escribas en el textarea
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error("Error al enviar mensaje: " + text);
      }

      setMessage("");
      setMessageStatus("Mensaje enviado correctamente ✅");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al enviar mensaje");
    } finally {
      setLoading(false);
    }
  };

  // ============== VISTAS ==============

  // Si YA hay token -> mostramos el formulario protegido de mensajes
  if (token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Enviar Mensaje (Zona Protegida)</h1>
          <p>
            Autenticado como <strong>{username || "usuario"}</strong>
          </p>

          <form onSubmit={handleSendMessage}>
            <label>
              Mensaje
              <textarea
                placeholder="Escribe tu mensaje aquí..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            {error && <p className="error">{error}</p>}
            {messageStatus && <p className="success">{messageStatus}</p>}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>

          <button className="btn secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Si NO hay token -> pantalla de login (Serie I)
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Login</h1>
        <p className="hint">
          Usuario = parte antes de <code>@miumg.edu.gt</code> <br />
          Ejemplo: <code>chernandezl12</code> <br />
          Contraseña de prueba: <code>123456a</code>
        </p>

        <label>
          Usuario
          <input
            type="text"
            placeholder="ej. chernandezl12"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            placeholder="•••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}

export default App;
