export const generateMainDiv = (colorList = ['red', 'blue', 'green']) =>
  `<div style="display: flex; flex-wrap: wrap; gap: 2px; padding: 10px">${colorList
    .map((item) => singleColorDiv(item))
    .join('')}</div>`;

const size = '20px';

const singleColorDiv = (color: string) =>
  `<div style="background-color: ${color}; width: ${size}; height: ${size}"></div>`;
