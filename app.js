const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

//initializeDbAndServer

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http:localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error: ${error.message}`);
  }
};

initializeDbAndServer();

const checkValidData = async (request, response, next) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  var validStatus = false;
  var validPriority = false;
  var validCategory = false;

  //Check for valid status
  if (
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === undefined
  ) {
    var validStatus = true;
    request.validStatus = validStatus;
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  //Check for valid priority
  if (
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW" ||
    priority === undefined
  ) {
    var validPriority = true;
    request.validPriority = validPriority;
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  //Check for valid category
  if (
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === undefined
  ) {
    var validCategory = true;
    request.validCategory = validCategory;
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  if (
    validStatus === true &&
    validCategory === true &&
    validPriority === true
  ) {
    next();
  }
};

//todo get API 1

app.get("/todos/", async (request, response) => {
  const status = request.query.status;
  const priority = request.query.priority;
  const category = request.query.category;
  const search_q = request.query.search_q;

  var validStatus = false;
  var validPriority = false;
  var validCategory = false;

  //Check for valid status
  if (
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === undefined
  ) {
    var validStatus = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  //Check for valid priority
  if (
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW" ||
    priority === undefined
  ) {
    var validPriority = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  //Check for valid category
  if (
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === undefined
  ) {
    var validCategory = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  if (
    validPriority === true &&
    validStatus === true &&
    priority !== undefined &&
    status !== undefined
  ) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE priority = '${priority}' AND status = '${status}';
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (
    validCategory === true &&
    validStatus === true &&
    category !== undefined &&
    status !== undefined
  ) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE category = '${category}' AND status = '${status}';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (
    validCategory === true &&
    validPriority === true &&
    category !== undefined &&
    priority !== undefined
  ) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE category = '${category}' AND priority = '${priority}';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (validStatus === true && status !== undefined) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE status = '${status}';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (validPriority === true && priority !== undefined) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE priority = '${priority}';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (validCategory === true && category !== undefined) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE category = '${category}';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  } else if (search_q !== undefined) {
    const filterQuery = `
      SELECT id,todo,priority,status,category,due_date as dueDate
      FROM todo WHERE todo LIKE '%${search_q}%';      
      `;
    const filterResponse = await db.all(filterQuery);
    response.send(filterResponse);
  }
});

//todos/:todoId/ using get method

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const filterQuery = `
    SELECT id,todo,priority,status,category,due_date as dueDate
    FROM todo WHERE id = '${todoId}';
    `;
  const filterResponse = await db.get(filterQuery);
  response.send(filterResponse);
});

//Filter by date
app.get("/agenda/", async (request, response) => {
  const date = request.query.date;
  const year = date.split("-")[0];
  const month = date.split("-")[1] - 1;
  const day = date.split("-")[2];
  const formattedDate = format(new Date(year, month, day), "yyyy-MM-dd");

  if (month < 12 && day < 31 && day !== 0) {
    const dateQuery = `
      SELECT
        id,todo,priority,status,category,due_date as dueDate
      FROM todo
      WHERE due_date = '${formattedDate}'; 
      `;
    const dateResponse = await db.all(dateQuery);
    response.send(dateResponse);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//create a todo in the todo table\

app.post("/todos/", checkValidData, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (
    request.validStatus === true &&
    request.validCategory === true &&
    request.validPriority === true
  ) {
    const addTodoQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES
        (${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}');
    `;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", checkValidData, async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;

  if (request.validStatus === true && status !== undefined) {
    const updateQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = ${todoId};
            `;
    const updateResponse = await db.get(updateQuery);
    response.send("Status Updated");
  } else if (request.validPriority === true && priority !== undefined) {
    const updateQuery = `
            UPDATE todo
            SET priority = '${priority}'
            WHERE id = ${todoId};
            `;
    const updateResponse = await db.get(updateQuery);
    response.send("Priority Updated");
  } else if (request.validCategory === true && category !== undefined) {
    const updateQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = ${todoId};
            `;
    const updateResponse = await db.get(updateQuery);
    response.send("Category Updated");
  } else if (todo !== undefined) {
    const updateQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = ${todoId};
            `;
    const updateResponse = await db.get(updateQuery);
    response.send("Todo Updated");
  }
});

//Delete todo from todo Id

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE 
    FROM todo
    WHERE id = '${todoId}';
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

//result

module.exports = app;
