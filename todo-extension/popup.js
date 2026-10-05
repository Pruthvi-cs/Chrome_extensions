const todoInput =
    document.getElementById("todoInput");

const addButton =
    document.getElementById("addButton");

const todoList =
    document.getElementById("todoList");


addButton.addEventListener(
    "click",
    () => {

        const task =
            todoInput.value.trim();


        if (task === "") {

            return;

        }


        const li =
            document.createElement("li");


        li.textContent =
            task;


        todoList.appendChild(li);


        todoInput.value = "";

    }
);