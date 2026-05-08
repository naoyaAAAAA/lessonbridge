import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [parentCode, setParentCode] = useState("");
  const [parent, setParent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function fetchParentPosts(code) {
    const response = await fetch(
      `${API_BASE_URL}/api/parent/posts?parent_code=${encodeURIComponent(code)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch parent posts");
    }

    const data = await response.json();
    setPosts(data);
  }

  async function fetchMessages(postId, code) {
    const response = await fetch(
      `${API_BASE_URL}/api/parent/posts/${postId}/messages?parent_code=${encodeURIComponent(
        code
      )}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = await response.json();
    setMessages(data);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const code = parentCode.trim();

    if (!code) {
      setError("保護者コードを入力してください。");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/parent/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_code: code,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setParent(data);
      setNotice("ログインしました。");
      localStorage.setItem("lessonbridge_parent_code", code);

      await fetchParentPosts(code);
    } catch (err) {
      setError("保護者コードが正しくありません。");
      setParent(null);
      setPosts([]);
    }
  }

  async function handleRefreshPosts() {
    if (!parent) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await fetchParentPosts(parent.parent_code);
      setNotice("投稿一覧を更新しました。");
    } catch (err) {
      setError("投稿一覧の取得に失敗しました。");
    }
  }

  async function handleOpenMessages(postId) {
    if (!parent) {
      return;
    }

    setError("");
    setNotice("");
    setActivePostId(postId);
    setMessageText("");

    try {
      await fetchMessages(postId, parent.parent_code);
    } catch (err) {
      setError("メッセージの取得に失敗しました。");
    }
  }

  async function handleSendMessage(postId) {
    if (!parent) {
      return;
    }

    setError("");
    setNotice("");

    const text = messageText.trim();

    if (!text) {
      setError("相談内容を入力してください。");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/parent/posts/${postId}/messages?parent_code=${encodeURIComponent(
          parent.parent_code
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessageText("");
      setNotice("先生にメッセージを送信しました。");
      await fetchMessages(postId, parent.parent_code);
    } catch (err) {
      setError("メッセージの送信に失敗しました。");
    }
  }
  async function loginWithCode(code) {
    const response = await fetch(`${API_BASE_URL}/api/parent/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent_code: code,
      }),
    });

    if (!response.ok) {
      throw new Error("Auto login failed");
    }

    const data = await response.json();
    setParent(data);
    setParentCode(code);
    await fetchParentPosts(code);
  }
  function handleLogout() {
    localStorage.removeItem("lessonbridge_parent_code");
    setParent(null);
    setParentCode("");
    setPosts([]);
    setActivePostId(null);
    setMessages([]);
    setMessageText("");
    setError("");
    setNotice("");
  }
  useEffect(() => {
    async function restoreLogin() {
      const savedCode = localStorage.getItem("lessonbridge_parent_code");

      if (!savedCode) {
        return;
      }

      try {
        await loginWithCode(savedCode);
      } catch (err) {
        localStorage.removeItem("lessonbridge_parent_code");
        setParent(null);
        setPosts([]);
      }
    }

    restoreLogin();
  }, []);
  return (
    <main className="app">
      <section className="hero">
        <p className="label">Parent App</p>
        <h1>LessonBridge</h1>
        <p className="description">
          講師から共有された授業内容・宿題・家庭学習のポイントを確認し、
          必要に応じて先生に個別相談できます。
        </p>
      </section>

      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">{notice}</div>}

      {!parent ? (
        <section className="card login-card">
          <h2>保護者コードでログイン</h2>
          <p className="subtext">
            講師から共有された保護者コードを入力してください。
          </p>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              保護者コード
              <input
                value={parentCode}
                onChange={(event) => setParentCode(event.target.value)}
                placeholder="例：PARENT-A8K3ZQ"
              />
            </label>

            <button className="primary-button" type="submit">
              ログイン
            </button>
          </form>
        </section>
      ) : (
        <section className="parent-layout">
          <section className="card profile-card">
            <div>
              <p className="section-kicker">Logged in</p>
              <h2>{parent.name}さん</h2>
              {parent.child_name && (
                <p className="subtext">
                  {parent.child_name}さんの保護者としてログイン中
                </p>
              )}
              <p className="code-text">保護者コード：{parent.parent_code}</p>
            </div>

            <button className="secondary-button" onClick={handleLogout}>
              ログアウト
            </button>
          </section>

          <section className="card posts-card">
            <div className="section-header">
              <div>
                <p className="section-kicker">Shared Posts</p>
                <h2>先生からの共有</h2>
              </div>

              <button className="secondary-button" onClick={handleRefreshPosts}>
                更新
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="empty">
                <p>まだ共有された投稿はありません。</p>
                <p>先生が投稿を共有すると、ここに表示されます。</p>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <article className="post-card" key={post.id}>
                    <p className="post-category">{post.category}</p>
                    <h3>{post.title}</h3>

                    <p className="post-meta">
                      対象: {post.target_group} / 投稿日:{" "}
                      {new Date(post.updated_at).toLocaleString("ja-JP")}
                    </p>

                    <p className="post-content">{post.content}</p>

                    {post.homework && (
                      <div className="mini-section">
                        <strong>宿題</strong>
                        <p>{post.homework}</p>
                      </div>
                    )}

                    {post.home_support && (
                      <div className="mini-section">
                        <strong>家庭で見てほしいこと</strong>
                        <p>{post.home_support}</p>
                      </div>
                    )}

                    {post.next_plan && (
                      <div className="mini-section">
                        <strong>次回の方針</strong>
                        <p>{post.next_plan}</p>
                      </div>
                    )}

                    {post.message_to_parents && (
                      <div className="mini-section">
                        <strong>先生からのメッセージ</strong>
                        <p>{post.message_to_parents}</p>
                      </div>
                    )}

                    <div className="post-actions">
                      <button
                        className="message-open-button"
                        onClick={() => handleOpenMessages(post.id)}
                      >
                        先生に個別相談する
                      </button>
                    </div>

                    {activePostId === post.id && (
                      <div className="message-panel">
                        <h4>先生との個別相談</h4>

                        {messages.length === 0 ? (
                          <p className="message-empty">
                            まだこの投稿についての相談はありません。
                          </p>
                        ) : (
                          <div className="message-list">
                            {messages.map((message) => (
                              <div
                                className={
                                  message.sender_type === "teacher"
                                    ? "message-bubble teacher-message"
                                    : "message-bubble parent-message"
                                }
                                key={message.id}
                              >
                                <p className="message-sender">
                                  {message.sender_type === "teacher"
                                    ? "先生"
                                    : "保護者"}
                                </p>
                                <p>{message.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="reply-box">
                          <textarea
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            rows="4"
                            placeholder="先生に相談したいことを入力してください。"
                          />

                          <button
                            className="primary-button"
                            onClick={() => handleSendMessage(post.id)}
                          >
                            先生に送信
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}

export default App;