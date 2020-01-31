import React,{Component} from "react";
import TodoStore from "../store/TodoStore"

class TodoEntry extends Component{
    state={
        value:''
    }
handleKeyDown=event=>{
    if(event.keyCode !==13){
        return;
    }
    event.preventDefault();
    TodoStore.addTodo(this.state.value)
    this.setState({
        value:''
    })
}

    render(){
        return(
            <header className="header">
            <h1 className="header">Todo</h1>
            <input 
            onChange={event=>this.setState({value:event.target.value})}
            onKeyDown={ event=>this.handleKeyDown(event)} type="text"
            className="new-todo"
            value={this.state.value}
            placeholder="چه کاری می خواهید انجام دهید؟"/>
        </header>
        )
    }
}
export default TodoEntry;