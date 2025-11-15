import { useState, useEffect } from "react";
import "./App.css";

const LOGIN_URL =
  "https://backcvbgtmdesa.azurewebsites.net/api/login/authenticate";
const MENSAJES_URL =
  "https://backcvbgtmdesa.azurewebsites.net/api/Mensajes";
const MENSAJES_LIST_URL =
  "https://prueba-api-zd2m.onrender.com/chat-mensajes";

function App() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Serie II
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  // Serie III
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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
          Username: username,
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
    setMessages([]);
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
      const authHeader = currentToken.startsWith("Bearer ")
        ? currentToken
        : `Bearer ${currentToken}`;

      const res = await fetch(MENSAJES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader, // crítico
        },
        body: JSON.stringify({
          Cod_Sala: 0,
          Login_Emisor: username,
          Contenido: message,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error("Error al enviar mensaje: " + text);
      }

      setMessage("");
      setMessageStatus("Mensaje enviado correctamente ✅");

      // refrescar lista de mensajes (Serie III)
      fetchMessages();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al enviar mensaje");
    } finally {
      setLoading(false);
    }
  };

  // ============== SERIE III: LISTA CRONOLÓGICA ==============
  const fetchMessages = async () => {
    setLoadingMessages(true);
    setError("");
    try {
      const res = await fetch(MENSAJES_LIST_URL);
      if (!res.ok) {
        throw new Error("No se pudieron obtener los mensajes.");
      }
      const data = await res.json();

      // Intentamos adaptarnos a distintos formatos de respuesta
      let list = Array.isArray(data) ? data : data.data || data.result || [];

      // Si viene vacío, al menos evitamos romper
      if (!Array.isArray(list)) list = [];

      // Si tiene fecha, podrías ordenar aquí.
      // Asumimos que ya viene ordenado desde la API.
      setMessages(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar mensajes");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Cuando hay token, cargamos mensajes al entrar
  useEffect(() => {
    if (token) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ============== VISTAS ==============

  // Ya autenticado: formulario + lista de mensajes
  if (token) {
    return (
      <div className="login-container">
        <div className="login-card wide">
          <h1>Chat UMG</h1>
          <p className="hint">
            Autenticado como <strong>{username || "usuario"}</strong>
          </p>

          {/* SERIE II: envío de mensaje */}
          <form onSubmit={handleSendMessage} className="message-form">
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

          {/* SERIE III: lista cronológica */}
          <div className="messages-header">
            <h2>Mensajes del chat</h2>
            <button
              className="btn small"
              type="button"
              onClick={fetchMessages}
              disabled={loadingMessages}
            >
              {loadingMessages ? "Cargando..." : "Refrescar"}
            </button>
          </div>

          <div className="messages-list">
            {messages.length === 0 && !loadingMessages && (
              <p className="hint">No hay mensajes para mostrar.</p>
            )}

            {messages.map((msg, index) => {
              // Intentamos leer campos típicos
              const emisor =
                msg.Login_Emisor ||
                msg.login_emisor ||
                msg.usuario ||
                "Anónimo";
              const contenido =
                msg.Contenido || msg.contenido || msg.mensaje || "(sin texto)";
              const fecha =
                msg.FechaEnvio ||
                msg.fechaEnvio ||
                msg.Fecha ||
                msg.fecha ||
                "";

              return (
                <div key={msg.Id || msg.id || index} className="message-item">
                  <div className="message-header">
                    <span className="message-user">{emisor}</span>
                    {fecha && (
                      <span className="message-date">
                        {String(fecha).toString()}
                      </span>
                    )}
                  </div>
                  <p className="message-text">{contenido}</p>
                </div>
              );
            })}
          </div>

          <button className="btn secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Si NO hay token -> login normal (Serie I)
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
