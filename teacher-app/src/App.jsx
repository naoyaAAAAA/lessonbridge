import { useEffect, useMemo, useState } from "react";
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
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  const sharedCount = posts.filter((post) => post.is_shared).length;
  const draftCount = posts.length - sharedCount;

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

    if (!selectedPostId && data.length > 0) {
      setSelectedPostId(data[0].id);
    }
  }

  async function fetchThreads(postId) {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/threads`);

    if (!response.ok) {
      throw new Error("Failed to fetch threads");
    }

    const data = await response.json();
    setThreads(data);
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

      const createdPost = await response.json();

      setForm(initialForm);
      setSelectedPostId(createdPost.id);
      setThreads([]);
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

  async function handleSelectPost(postId) {
    setSelectedPostId(postId);
    setError("");
    setNotice("");

    try {
      await fetchThreads(postId);
    } catch (err) {
      setThreads([]);
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
      await fetchThreads(postId);
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
            保護者全体への共有投稿を作成し、投稿ごとの個別相談を管理する講師向け画面です。
          </p>
        </div>

        <div className="api-pill">{health ? `API: ${health.status}` : "API確認中"}</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>投稿数</span>
          <strong>{posts.length}</strong>
        </div>
        <div className="stat-card">
          <span>共有済み</span>
          <strong>{sharedCount}</strong>
        </div>
        <div className="stat-card">
          <span>下書き</span>
          <strong>{draftCount}</strong>
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}
      {notice && <div className="alert success-alert">{notice}</div>}

      <section className="create-shell">
        <div className="create-header">
          <div>
            <p className="section-kicker">Create</p>
            <h2>共有投稿を作成</h2>
          </div>

          <button className="secondary-button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "フォームを閉じる" : "フォームを開く"}
          </button>
        </div>

        {showForm && (
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
                rows="4"
                placeholder="授業で扱った内容や、全体として見えた課題を書きます。"
              />
            </label>

            <div className="form-grid">
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
                  placeholder="例：線分図を書いているか確認してください。"
                />
              </label>
            </div>

            <div className="form-grid">
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
                  placeholder="例：ご家庭でも取り組み方を見ていただけると助かります。"
                />
              </label>
            </div>

            <button className="primary-button" type="submit">
              投稿を作成
            </button>
          </form>
        )}
      </section>

      <section className="dashboard">
        <aside className="post-sidebar">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Posts</p>
              <h2>投稿一覧</h2>
            </div>

            <button className="icon-button" onClick={fetchPosts}>
              更新
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="empty">
              <p>まだ投稿がありません。</p>
              <p>上のフォームから投稿を作成できます。</p>
            </div>
          ) : (
            <div className="compact-post-list">
              {posts.map((post) => (
                <button
                  className={
                    selectedPostId === post.id
                      ? "compact-post-card selected"
                      : "compact-post-card"
                  }
                  key={post.id}
                  onClick={() => handleSelectPost(post.id)}
                >
                  <div>
                    <span className="post-category">{post.category}</span>
                    <h3>{post.title}</h3>
                    <p>{post.target_group}</p>
                  </div>

                  <span className={post.is_shared ? "badge shared" : "badge draft"}>
                    {post.is_shared ? "共有済み" : "下書き"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="detail-panel">
          {!selectedPost ? (
            <div className="empty large-empty">
              <p>投稿を選択してください。</p>
            </div>
          ) : (
            <>
              <div className="detail-header">
                <div>
                  <span className="post-category">{selectedPost.category}</span>
                  <h2>{selectedPost.title}</h2>
                  <p className="post-meta">
                    対象: {selectedPost.target_group} / 作成日:{" "}
                    {new Date(selectedPost.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>

                {!selectedPost.is_shared ? (
                  <button
                    className="share-button"
                    onClick={() => handleShare(selectedPost.id)}
                  >
                    保護者に共有する
                  </button>
                ) : (
                  <span className="shared-note">保護者アプリに表示中</span>
                )}
              </div>

              <div className="detail-body">
                <section>
                  <h4>本文</h4>
                  <p>{selectedPost.content}</p>
                </section>

                {selectedPost.homework && (
                  <section>
                    <h4>宿題</h4>
                    <p>{selectedPost.homework}</p>
                  </section>
                )}

                {selectedPost.home_support && (
                  <section>
                    <h4>家庭で見てほしいこと</h4>
                    <p>{selectedPost.home_support}</p>
                  </section>
                )}

                {selectedPost.next_plan && (
                  <section>
                    <h4>次回の方針</h4>
                    <p>{selectedPost.next_plan}</p>
                  </section>
                )}

                {selectedPost.message_to_parents && (
                  <section>
                    <h4>保護者へのメッセージ</h4>
                    <p>{selectedPost.message_to_parents}</p>
                  </section>
                )}
              </div>

              <div className="thread-panel">
                <div className="panel-header">
                  <div>
                    <p className="section-kicker">Private Threads</p>
                    <h3>保護者からの個別返信</h3>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() => handleSelectPost(selectedPost.id)}
                  >
                    返信を更新
                  </button>
                </div>

                {threads.length === 0 ? (
                  <p className="thread-empty">まだ保護者からの返信はありません。</p>
                ) : (
                  <div className="thread-list">
                    {threads.map((thread) => (
                      <div className="thread-card" key={thread.parent.id}>
                        <div className="thread-parent">
                          <div>
                            <strong>{thread.parent.name}</strong>
                            {thread.parent.child_name && (
                              <span>お子さま: {thread.parent.child_name}</span>
                            )}
                          </div>
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
                            onClick={() =>
                              handleSendTeacherReply(selectedPost.id, thread.parent.id)
                            }
                          >
                            返信する
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;