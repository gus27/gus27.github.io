## Website Performance Optimization portfolio project

### How to run

To inspect the result you should visit:

* https://gus27.github.io/udportfolio/index.html
* https://gus27.github.io/udportfolio/views/pizza.html

### Optimizations

####Part 1: Optimize PageSpeed Insights score for index.html

* optimized image sizes
* media query for print.css
* async for analytics.js
* minified style.css and inserted this in <style> tag in index.html

####Part 2: Optimize Frames per Second in pizza.html

##### Frame Rate

* moved `items` and `itemsLen` to a global variables and called DOM for `.mover` class elements only once
* changed number of pizzas from 200 to 40 (5 rows with 8 pizzas)
* changed function call to `updatePositions` so that it is called by `requestAnimationFrame`
* cache CPU extensive `sin` calculation inside `updatePositions`
* changed style for `#movingPizzas1` so that the containing pizza images are all on a separate layer

##### Computational Efficiency (pizza slider)

* Optimized changePizzaSizes() function so that newWidth is calculated only once and then set for all pizzas. 
* Calling DOM query for .randomPizzaContainer only one time per function call.
