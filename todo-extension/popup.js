const todoInput = document.getElementById("todoInput");
const addButton = document.getElementById("addButton");
const todoList = document.getElementById("todoList");
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


    todos.forEach((task, index) => {

        const li =
            document.createElement("li");


        const text =
            document.createElement("span");

        text.textContent =
            task;


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "Del";


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


        li.appendChild(text);

        li.appendChild(deleteButton);

        todoList.appendChild(li);

    });

}