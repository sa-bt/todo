import React, {Component} from 'react';
import TodoEntry from "./component/TodoEntry";
import TodoItems from "./component/TodoItems";
import TodoFooter from "./component/Footer"
import TodoStore from "./store/TodoStore";
import ViewStore from "./store/ViewStore";
import './App.css';


class App extends Component {
    render() {
        //const initialState = window.initialState && JSON.parse(window.initialState) || {};

        let todoStore = TodoStore;
        let viewStore = new ViewStore();
        return (
            <div className="todoapp" id="todoapp">
                <TodoEntry/>
                <TodoItems todoStore={todoStore} viewStore={viewStore}/>
                <TodoFooter todoStore={todoStore} viewStore={viewStore} />
            </div>
        );
    }
}

export default App;
