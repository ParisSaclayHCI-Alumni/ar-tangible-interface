import { createRoot } from 'react-dom/client';
import React from 'react';
import App from "./App";

const container = document.getElementById("container");
const root = createRoot(container!); // createRoot(container!) if you use TypeScrip
root.render(<App tab="home" />);

