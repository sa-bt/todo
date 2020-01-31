import React,{Component} from "react";
import {observer} from "mobx-react";
import {action} from "mobx";
import TodoModel from "../store/TodoStore"
@observer
class TodoItem extends Component{
state={delete:false}
onToggle=()=>{
    this.props.todo.toggle()
}


    render(){
        const{todo}=this.props
        return(
        <li className={todo.completed ? 'completed':''}>

            <div className="view">
                <input type="checkbox"
                onChange={this.onToggle}
                className="toggle" 
                value="on" 
                checked={todo.completed}/>

        <label>{todo.title}</label>

                <button className="destroy" onClick={this.handleDestroy} />
            </div>
        </li>
        )
    }
    @action
    handleDestroy = () => {
        this.props.todo.destroy();
    }

}

export default TodoItem;