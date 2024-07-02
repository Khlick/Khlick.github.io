import { Axes } from 'plotlib';
import datArr from '../data/IRIS.js';

let fWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
const figureWidth = fWidth < 800 ? fWidth*0.8 : 800;
const figureHeight = 440;
const ylabel = "Ordinate";
const xlabel = "Abscissa";
const ygrid = true;
const xgrid = true;
const layout = {
    "width": figureWidth,
    "height": figureHeight,
    "yaxis": {
        "title": ylabel,
        "zerolinecolor": "rgba(174, 174, 174,1)",
        "zeroline": true,
        "grid": ygrid
    }, 
    "xaxis": {
        "title": xlabel, 
        "zerolinecolor": "rgba(174, 174, 174,1)",
        "zeroline": true,
        "grid": xgrid
    }, 
    "font": {
        "family": "Times New Roman", 
        "size": 16
    }, 
    "margin": {
        "r": 15, 
        "b": 40, 
        "l": 60, 
        "t": 15
    }
};

// setup
const parent = document.getElementById("axes");
const ax = new Axes(datArr,parent,layout);
ax.init();