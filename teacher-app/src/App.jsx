import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

const initialForm = {
  title: "",
  category: "授業報告",
  target_group: "",
  content: "",
  homework: "",
  home_support: "",
  next_plan: "",
  message_to_parents: "",
};

function App() {
  const [health, setHealth] = useState(null);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [activePostId, setActivePostId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function fetchHealth() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error("API health check failed");
    }
    const data = await response.json();
    setHealth(data);
  }

  async function fetchPosts() {
    const response = await fetch(`${API_BASE_URL}/api/posts`);
    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }
    const data = await response.json();
    setPosts(data);
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        await fetchHealth();
        await fetchPosts();
      } catch (err) {
        setError("APIに接続できませんでした。backend が起動しているか確認してください。");
      }
    }

    loadInitialData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.title || !form.target_group || !form.content) {
      setError("タイトル・対象・本文は必須です。");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      setForm(initialForm);
      setNotice("投稿を作成しました。");
      await fetchPosts();
    } catch (err) {
      setError("投稿の作成に失敗しました。backend を確認してください。");
    }
  }
  async function handleShare(postId) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/share`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to share post");
      }

      setNotice("投稿を保護者に共有しました。");
      await fetchPosts();
    } catch (err) {
      setError("投稿の共有に失敗しました。backend を確認してください。");
    }
  }
  async function handleLoadThreads(postId) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/threads`);

      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }

      const data = await response.json();
      setActivePostId(postId);
      setThreads(data);
    } catch (err) {
      setError("保護者返信の取得に失敗しました。backend を確認してください。");
    }
  }
  function handleReplyChange(parentId, value) {
    setReplyTexts((current) => ({
      ...current,
      [parentId]: value,
    }));
  }

  async function handleSendTeacherReply(postId, parentId) {
    setError("");
    setNotice("");

    const message = replyTexts[parentId];

    if (!message || !message.trim()) {
      setError("返信内容を入力してください。");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/${postId}/threads/${parentId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send teacher reply");
      }

      setReplyTexts((current) => ({
        ...current,
        [parentId]: "",
      }));

      setNotice("保護者に返信しました。");
      await handleLoadThreads(postId);
    } catch (err) {
      setError("返信の送信に失敗しました。backend を確認してください。");
    }
  }
  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="label">Teacher App</p>
          <h1>LessonBridge</h1>
          <p className="description">
            保護者全体への共有投稿を作成し、個別相談につなげる講師向け管理画面です。
          </p>
        </div>

        <div className="api-pill">
          {health ? `API: ${health.status}` : "API確認中"}
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">{notice}</div>}

      <section className="layout">
        <section className="card form-card">
          <div className="section-header">
            <div>
              <p className="section-kicker">Create</p>
              <h2>共有投稿を作成</h2>
            </div>
          </div>

          <form className="post-form" onSubmit={handleSubmit}>
            <label>
              タイトル *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例：小5算数 割合と比の授業報告"
              />
            </label>

            <div className="form-grid">
              <label>
                カテゴリ
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="授業報告">授業報告</option>
                  <option value="宿題連絡">宿題連絡</option>
                  <option value="テスト前連絡">テスト前連絡</option>
                  <option value="家庭学習アドバイス">家庭学習アドバイス</option>
                  <option value="重要なお知らせ">重要なお知らせ</option>
                  <option value="その他">その他</option>
                </select>
              </label>

              <label>
                対象 *
                <input
                  name="target_group"
                  value={form.target_group}
                  onChange={handleChange}
                  placeholder="例：小5算数クラス"
                />
              </label>
            </div>

            <label>
              本文 *
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows="5"
                placeholder="授業で扱った内容や、全体として見えた課題を書きます。"
              />
            </label>

            <label>
              宿題
              <textarea
                name="homework"
                value={form.homework}
                onChange={handleChange}
                rows="3"
                placeholder="例：基本問題2題、文章題2題"
              />
            </label>

            <label>
              家庭で見てほしいこと
              <textarea
                name="home_support"
                value={form.home_support}
                onChange={handleChange}
                rows="3"
                placeholder="例：答えだけでなく、線分図を書いているか確認してください。"
              />
            </label>

            <label>
              次回の方針
              <textarea
                name="next_plan"
                value={form.next_plan}
                onChange={handleChange}
                rows="3"
                placeholder="例：次回は線分図から式を立てる練習をします。"
              />
            </label>

            <label>
              保護者へのメッセージ
              <textarea
                name="message_to_parents"
                value={form.message_to_parents}
                onChange={handleChange}
                rows="3"
                placeholder="例：ご家庭でも文章題への取り組み方を見ていただけると助かります。"
              />
            </label>

            <button className="primary-button" type="submit">
              投稿を作成
            </button>
          </form>
        </section>

        <section className="card list-card">
          <div className="section-header">
            <div>
              <p className="section-kicker">Posts</p>
              <h2>共有投稿一覧</h2>
            </div>
            <button className="secondary-button" onClick={fetchPosts}>
              更新
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="empty">
              <p>まだ投稿がありません。</p>
              <p>左のフォームから最初の投稿を作成できます。</p>
            </div>
          ) : (
            <div className="post-list">
              {posts.map((post) => (
                <article className="post-card" key={post.id}>
                  <div className="post-card-header">
                    <div>
                      <p className="post-category">{post.category}</p>
                      <h3>{post.title}</h3>
                    </div>
                    <span className={post.is_shared ? "badge shared" : "badge draft"}>
                      {post.is_shared ? "共有済み" : "下書き"}
                    </span>
                  </div>

                  <p className="post-meta">
                    対象: {post.target_group} / 作成日:{" "}
                    {new Date(post.created_at).toLocaleString("ja-JP")}
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

                  <div className="post-actions">
                    <button className="thread-button" onClick={() => handleLoadThreads(post.id)}>
                      保護者返信を見る
                    </button>

                    {!post.is_shared ? (
                      <button className="share-button" onClick={() => handleShare(post.id)}>
                        保護者に共有する
                      </button>
                    ) : (
                      <span className="shared-note">保護者アプリに表示中</span>
                    )}
                  </div>
                  {activePostId === post.id && (
                    <div className="thread-panel">
                      <h4>保護者からの個別返信</h4>

                      {threads.length === 0 ? (
                        <p className="thread-empty">まだ保護者からの返信はありません。</p>
                      ) : (
                        <div className="thread-list">
                          {threads.map((thread) => (
                            <div className="thread-card" key={thread.parent.id}>
                              <div className="thread-parent">
                                <strong>{thread.parent.name}</strong>
                                {thread.parent.child_name && (
                                  <span>お子さま: {thread.parent.child_name}</span>
                                )}
                              </div>

                              <div className="message-list">
                                {thread.messages.map((message) => (
                                  <div
                                    className={
                                      message.sender_type === "teacher"
                                        ? "message-bubble teacher-message"
                                        : "message-bubble parent-message"
                                    }
                                    key={message.id}
                                  >
                                    <p className="message-sender">
                                      {message.sender_type === "teacher" ? "講師" : "保護者"}
                                    </p>
                                    <p>{message.message}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="reply-box">
                                <textarea
                                  value={replyTexts[thread.parent.id] || ""}
                                  onChange={(event) =>
                                    handleReplyChange(thread.parent.id, event.target.value)
                                  }
                                  rows="3"
                                  placeholder={`${thread.parent.name}さんへの返信を入力`}
                                />

                                <button
                                  className="reply-button"
                                  onClick={() => handleSendTeacherReply(post.id, thread.parent.id)}
                                >
                                  返信する
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;