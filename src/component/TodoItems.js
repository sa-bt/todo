import React, {Component} from "react";
import TodoItem from "./TodoItem";
import PropTypes from 'prop-types';

import TodoStore from "../store/TodoStore";
import {observer} from "mobx-react";
import { ACTIVE_TODOS, COMPLETED_TODOS } from '../constants';


@observer
class TodoItems extends Component {
    render() {
        const {todoStore, viewStore} = this.props;
        if (todoStore.Todos.length === 0)
        return null;
        return (
            <section className="main">
                <input
				className="toggle-all"
				id="toggle-all"
				type="checkbox"
				onChange={this.toggleAll}
				checked={todoStore.activeTodoCount === 0}
			/>
			<label htmlFor="toggle-all"></label>
                <ul className="todo-list">
                    {
                        this.getVisibleTodos().map(todo => {
                            return (
                                <TodoItem todo={todo}/>
                            )
                        })
                    }
                </ul>
            </section>
        )
        
    }
    getVisibleTodos() {
		return this.props.todoStore.Todos.filter(todo => {
			switch (this.props.viewStore.todoFilter) {
				case ACTIVE_TODOS:
					return !todo.completed;
				case COMPLETED_TODOS:
					return todo.completed;
				default:
					return true;
			}
		});
	}

	toggleAll = (event) => {
		var checked = event.target.checked;
		this.props.todoStore.toggleAll(checked);
	};
}


export default TodoItems;

TodoItems.propTypes = {
	viewStore: PropTypes.object.isRequired,
	todoStore: PropTypes.object.isRequired
}