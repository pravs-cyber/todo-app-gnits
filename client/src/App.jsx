import { useEffect, useState } from "react";
import { getTodos, createTodo, updateTodo, deleteTodo } from "./api";
import { FILTERS } from "./filters";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [todosPerPage, setTodosPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Runs an API action and shows its error in the banner if it fails
  const run = async (action) => {
    try {
      setError("");
      await action();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };
  useEffect(() => {
  setCurrentPage(1);
}, [search, filter]);
  useEffect(() => {
    run(async () => setTodos(await getTodos())).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleAdd = (title) =>
    run(async () => {
      const newTodo = await createTodo(title);

      setTodos((prev) => [newTodo, ...prev]);
      setCurrentPage(1);
    });

  const handleUpdate = (id, data) =>
    run(async () => {
      const updated = await updateTodo(id, data);
      setTodos((prev) =>
      prev.map((todo) =>
        todo._id === id ? updated : todo
      )
    );
      // replaced with `updated` (keep every other todo as it is).
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    });

  const handleClearDone = () =>
    run(async () => {
      const done = todos.filter(FILTERS.done.test);
      await Promise.all(done.map((t) => deleteTodo(t._id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
    });

  const filteredTodos = todos
    .filter(FILTERS[filter].test)
    .filter((todo) =>
      todo.title.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(
    filteredTodos.length / todosPerPage
  );

  const startIndex = (currentPage - 1) * todosPerPage;

  const paginatedTodos = filteredTodos.slice(
    startIndex,
    startIndex + todosPerPage
  );
  useEffect(() => {
    const totalPages = Math.ceil(filteredTodos.length / todosPerPage);

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredTodos.length, todosPerPage, currentPage]);
  return (
    <div className="layout">
      <Sidebar
        todos={todos}
        filter={filter}
        onFilter={setFilter}
        onClearDone={handleClearDone}
      />

      <main className="panel content">
        <header className="content-header">
          <h2>{FILTERS[filter].label}</h2>

          <span className="content-count">
            {filteredTodos.length}{" "}
            {filteredTodos.length === 1 ? "task" : "tasks"}
          </span>
        </header>

        {/* Search */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search todos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <TodoForm onAdd={handleAdd} />

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filteredTodos.length === 0 ? (
          <div className="empty">
            <img src="/logo.png" alt="" />
            <p>
              {filter === "done"
                ? "Nothing completed yet"
                : "You're all caught up. Add a task above."}
            </p>
          </div>
        ) : (
          <>
            <ul className="todo-list">
              {paginatedTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </ul>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="page-arrow"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                ←
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="page-arrow"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                →
              </button>

              <label className="todos-per-page">
                Todos per page:
                <select
                  value={todosPerPage}
                  onChange={(e) => {
                    setTodosPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
