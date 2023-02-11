const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const compareAsc = require("date-fns/compareAsc");
const format = require("date-fns/format");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "todoApplication.db");
let database;
const initializiDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Database error:${error.message}`);
    process.exit(1);
  }
};

initializiDatabaseAndServer();

const hasStatus = (query) => {
  return (
    query.status !== undefined &&
    query.priority === undefined &&
    query.category === undefined
  );
};

const hasPriority = (query) => {
  return (
    query.status === undefined &&
    query.priority !== undefined &&
    query.category === undefined
  );
};

const hasStatusAndPriority = (query) => {
  return (
    query.status !== undefined &&
    query.priority !== undefined &&
    query.category === undefined
  );
};

const hasStatusAndCategory = (query) => {
  return (
    query.status !== undefined &&
    query.priority === undefined &&
    query.category !== undefined
  );
};

const hasCategory = (query) => {
  return (
    query.status === undefined &&
    query.priority === undefined &&
    query.category !== undefined
  );
};

const hasCategoryAndPriority = (query) => {
  return (
    query.status === undefined &&
    query.priority !== undefined &&
    query.category !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { priority, status, category, search_q = "" } = request.query;
  let data;
  let sqlQuery;
  switch (true) {
    case hasStatus(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status='${status}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusAndPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}' AND status='${status}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status or Priority");
      }
      break;
    case hasStatusAndCategory(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status='${status}' AND category='${category}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status or Category");
      }
      break;
    case hasCategory(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category='${category}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category='${category}' AND priority='${priority}';`;
      data = await database.all(sqlQuery);
      if (data !== undefined) {
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category or Priority");
      }
      break;
    default:
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      data = await database.all(sqlQuery);
      response.send(data);
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectUserQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const data = await database.get(selectUserQuery);
  response.send(data);
});

app.get("/agenda/", async (request, response) => {
  const date = request.body;
  const convertedDate = new Date(date);
  let todoList;
  const totalTodos = `SELECT * FROM todo;`;
  const todos = await database.all(totalTodos);
  for (let item of todos) {
    let value = compareAsc(convertedDate, item.dueDate);
    if (value === 0) {
      todoList += item;
    }
  }
  response.send(todoList);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;
  const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,dueDate) VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  let query;
  let message;
  switch (true) {
    case status !== undefined:
      query = `UPDATE todo SET status='${status}'; WHERE id=${todoId}`;
      message = "Status Updated";
      break;
    case priority !== undefined:
      query = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      message = "Priority Updated";
      break;
    case todo !== undefined:
      query = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      message = "Todo Updated";
      break;
    case category !== undefined:
      query = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
      message = "Category Updated";
      break;
    case dueDate !== undefined:
      query = `UPDATE todo SET dueDate=${dueDate} WHERE id=${todoId};`;
      message = "Due Date Updated";
      break;

    default:
      break;
  }
  await database.run(query);
  response.send(message);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
