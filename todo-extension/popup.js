const todoInput = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const todoList = document.getElementById("todoList");
let todos = [];

addButton.addEventListener("click",async () => {

        const task =
            todoInput.value.trim();


        if (task === "") {

            return;

        }

        todos.push(task);

        await chrome.storage.local.set({
            todos: todos
        });
        
        const li = document.createElement("li");
        li.textContent =task;
        todoList.appendChild(li);
        todoInput.value = "";

    }
);