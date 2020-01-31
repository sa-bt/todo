import {action,observable,computed} from "mobx";
 import TodoModel from "./TodoModel";
 import * as Utils from '../utils';


class TodoStore{
    @observable Todos=[];
    @observable filter='all';
    lastID=0;

    @computed get activeTodoCount() {
        let s= this.Todos.reduce(
            (sum, todo) => sum + (todo.completed ? 0 : 1),
            0);
            console.log(s);
        return s;

    }

    @computed get completedCount() {
        return this.Todos.length - this.activeTodoCount;
    }


    @action
    clearCompleted () {
        this.Todos = this.Todos.filter(
            todo => !todo.completed
        );
    }

    @computed get filteredTodos() {
        console.log(this.filter)
        if(this.filter=="all"){
            return this.Todos;
        }else if(this.filter=="completed"){
            return this.todos.filter(todo=>todo.completed)
        }
    else if(this.filter=="notCompleted"){
        return this.todos.filter(todo=>!todo.completed)
    }
    }

toJS() {
    return this.Todos.map(todo => todo.toJS());
}

static fromJS(array) {
    const todoStore = new TodoStore();
    todoStore.Todos = array.map(item => TodoModel.fromJS(todoStore, item));
    return todoStore;
}

    @action
    addTodo(title){
        this.Todos.push(new TodoModel(
            this,
            title,
            false,
            this.lastID ++
        ) )
    }
   
}
const store=new TodoStore()
export default  store

