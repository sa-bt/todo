import {  observable } from "mobx";

export default class TodoModel{
    id
    store
    @observable title
    @observable completed

    constructor(store,title,completed,id){
        this.title=title
        this.completed=completed
        this.id=id
        this.store=store
    }
 
    toggle(){
        this.completed = !this.completed
    }
    destroy() {
        this.store.Todos.remove(this);
    }
    toJS() {
        return {
            id: this.id,
            title: this.title,
            completed: this.completed
        };
    }

}