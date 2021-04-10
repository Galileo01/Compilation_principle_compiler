import React from 'react';
import { render } from 'react-dom';
import Index from './views/Home';
const mainElement = document.createElement('div');
mainElement.setAttribute('id', 'root');
document.body.appendChild(mainElement);
document.title="编译器";
const App = () => {
  return (
    <>
      <Index />
    </>
  );
};
render(<App />, mainElement);
