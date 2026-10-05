const todoInput = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const todoList = document.getElementById("todoList");
const deleteButton =document.createElement("button");
let todos = [];

addButton.addEventListener(
    "click",
    async () => {

        const task =
            todoInput.value.trim();


        if (task === "") {

            return;

        }


        todos.push({

            text: task,

            completed: false

        });


        await chrome.storage.local.set({

            todos: todos

        });


        todoInput.value = "";


        renderTodos();

    }
);
async function loadTodos() {

    const result =
        await chrome.storage.local.get(
            "todos"
        );


    todos =
        result.todos || [];


    renderTodos();

}
loadTodos();


function renderTodos() {

    todoList.innerHTML = "";

    todos.forEach((todo, index) => {

        const li =
            document.createElement("li");


        // Checkbox

        const checkbox =
            document.createElement("input");

        checkbox.type =
            "checkbox";

        checkbox.checked =
            todo.completed;


        // Task text

        const text =
            document.createElement("span");

        text.textContent =
            todo.text;


        // Delete button

        const deleteButton =
            document.createElement("button");

            deleteButton.innerHTML = "&#128465;";


        // Complete / Uncomplete

        checkbox.addEventListener(
            "change",
            async () => {

                todo.completed =
                    checkbox.checked;


                await chrome.storage.local.set({
                    todos: todos
                });


                renderTodos();

            }
        );


        // Delete

        deleteButton.addEventListener(
            "click",
            async () => {

                todos.splice(index, 1);


                await chrome.storage.local.set({
                    todos: todos
                });


                renderTodos();

            }
        );


        // Strike completed task

        if (todo.completed) {

            text.style.textDecoration =
                "line-through";

        }


        li.appendChild(checkbox);

        li.appendChild(text);

        li.appendChild(deleteButton);


        todoList.appendChild(li);

    });

}