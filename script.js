/**
 * @author Vlad Litvak
 * @since 05.17.2020
 *
 * Scripts used in quadtree.html
 */



 /**
  * A point stored in the Quad Tree data structure.
  */
class Point {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
}

/**
 * A node stored in the Quad Tree data structure.
 */
class Node {
  constructor(id, minX, minY, maxX, maxY) {
    this.id = id;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.children = []; //top-left, top-right, bottom-left, bottom-right
    this.points = [];
  }
}


//global variables
const treeMinX = 0;
const treeMinY = 0;
const treeMaxX = 100;
const treeMaxY = 100;
var nodeId = 0;
var pointId = 0;
var root = new Node(nodeId, treeMinX, treeMinY, treeMaxX, treeMaxY);
var points = [];
var nodeCount = 1;
var leafNodeCount = 1;
var depthCount = 0;
var nodeCapacity = 3;
var pointsHidden = false;
var animationInProgress = false; //lock to ensure only one process happens at a time


/**
 * Adds a point (x, y) to the tree.
 * These values are taken from the text input on the webpage.
 */
function addPointFromInput() {

  if(animationInProgress) return;

  animationInProgress = true;

  var xInput = document.getElementById("addPointX");
  var yInput = document.getElementById("addPointY");

  if(addPointFromParameters(xInput.value, yInput.value)){
    //clears input if point added successfully
    xInput.value = "";
    yInput.value = "";
  }

  animationInProgress = false;
}


/**
 * Adds point (x, y) to the tree and coordinate panel on the webpage.
 *
 * @param  {integer} x The x coordinate.
 * @param  {integer} y The y coordinate.
 * @return {boolean}   True if successful added, otherwise, false.
 */
function addPointFromParameters(x, y) {

  if(!validInt(x) || !validInt(y)) {
    alert("X and Y must be integers between 1 and 99");
    return false;
  }

  if(!addPointToTree(++pointId, x, y)) {
    //if the point is already in the tree, alert thr user and return false
    alert("(" + x + ", " + y + ") is already in the tree");
    return false;
  }

  var pointDiv = document.createElement("div");
  pointDiv.setAttribute("class", "point");
  var newPointId = "point" + pointId;
  pointDiv.setAttribute("id", newPointId);
  pointDiv.setAttribute("onclick", "highlightPoint(" + pointId + ")");
  pointDiv.style.left = x + "%";
  pointDiv.style.bottom = y + "%";
  if(pointsHidden) {
    pointDiv.style.opacity = 0;
    pointDiv.style.visibility = "hidden";
  }

  var coordinatesDiv = document.createElement("coordinates");
  var newCoordinatesId = "coordinates" + pointId;
  coordinatesDiv.setAttribute("id", newCoordinatesId);
  coordinatesDiv.setAttribute("onclick", "highlightPoint(" + pointId + ")");
  coordinatesDiv.innerHTML = "(" + x + ", " + y + ")";

  //display point
  var stage = document.getElementById("stage");
  stage.appendChild(pointDiv);

  //display coordinates
  var coordinatepanel = document.getElementById("coordinatepanel");
  coordinatepanel.appendChild(coordinatesDiv);

  //point added successfully
  return true;
}


/**
 * Adds a point with a specfied ID to the Quad Tree data structure.
 *
 * @param  {integer} pointId The point's ID.
 * @param  {integer} x       The point's x coordinate.
 * @param  {integer} y       The points y coordinate.
 * @return {boolean}         True if successfully added, otherwise, false.
 */
function addPointToTree(pointId, x, y) {

  //gets the appropriate leaf node that the point should be added to
  var leafNode = getLeafNodeByCoordinate(root, x, y);

  //do not add duplicates into the tree
  if(pointInTree(leafNode, x, y)){
    pointId --;
    return false;
  }

  //adds new point to the leaf node
  var newPoint = new Point(pointId, x, y);
  leafNode.points.push(newPoint);
  points.push(newPoint);

  //if the leaf node is over capacity, split it recursively until no leaf node is over capacity
  if(leafNode.points.length > nodeCapacity) {
    splitNode(leafNode);
    //update tree stats to reflect changes
    updateTreeStats();
  }

  displayTreeStats();

  //point added successfully
  return true;
}


/**
 * Recursively searches for the leaf node whose range contains the point (x, y).
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @param  {integer} x    The point's x coordinate.
 * @param  {integer} y    The points y coordinate.
 * @return {Node}         The node whose range contains point (x, y).
 */
function getLeafNodeByCoordinate(node, x, y) {

  //if the node has no children, it is the leaf node which contains (x, y)
  if(node.children.length == 0) return node;

  //the coordinate is in the upper half of this node
  if(y > midY(node)) {

    //coordinate is in top-left child
    if(x < midX(node)) return getLeafNodeByCoordinate(node.children[0], x, y);

    //coordinate is in top-right child
    else return getLeafNodeByCoordinate(node.children[1], x, y);
  }

  //the coordinate is in lower half of this node
  else {

    //coordinate is in bottom-left child
    if(x < midX(node)) return getLeafNodeByCoordinate(node.children[2], x, y);

    //coordinate is in bottom-right child
    else return getLeafNodeByCoordinate(node.children[3], x, y);
  }
}


/**
 * Searches for the tree for point (x, y).
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @param  {integer} x    The point's x coordinate.
 * @param  {integer} y    The points y coordinate.
 * @return {boolean}      True if the point is in node's subtree, otherwise, false.
 */
function pointInTree(node, x, y) {

  var leafNode = getLeafNodeByCoordinate(node, x, y);

  for(var point of leafNode.points){
    if(point.x == x && point.y == y) return true;
  }

  return false;
}


/**
 * Splits a node into four subnodes and redistributes its points to those subnodes.
 *
 * @param {Node} node The node to be split.
 */
function splitNode(node) {

  //creates upper-left child div
  var upperLeftDiv = document.createElement("div");
  upperLeftDiv.setAttribute("class", "quadtreenode leftnode");
  var upperLeftId = "node" + ++nodeId;
  upperLeftDiv.setAttribute("id", upperLeftId);

  //creates upper-left node and adds it to the tree
  var upperLeftNode = new Node(nodeId, node.minX, midY(node), midX(node), node.maxY);
  node.children.push(upperLeftNode);

  //creates upper-right child div
  var upperRightDiv = document.createElement("div");
  upperRightDiv.setAttribute("class", "quadtreenode rightnode");
  var upperRightId = "node" + ++nodeId;
  upperRightDiv.setAttribute("id", upperRightId);

  //creates upper-right node and adds it to the tree
  var upperRightNode = new Node(nodeId, midX(node), midY(node), node.maxX, node.maxY);
  node.children.push(upperRightNode);

  //creates lower-left child div
  var lowerLeftDiv = document.createElement("div");
  lowerLeftDiv.setAttribute("class", "quadtreenode leftnode");
  var lowerLeftId = "node" + ++nodeId;
  lowerLeftDiv.setAttribute("id", lowerLeftId);

  //creates lower-left node and adds it to the tree
  var lowerLeftNode = new Node(nodeId, node.minX, node.minY, midX(node), midY(node));
  node.children.push(lowerLeftNode);

  //creates lower-right child div
  var lowerRightDiv = document.createElement("div");
  lowerRightDiv.setAttribute("class", "quadtreenode rightnode");
  var lowerRightId = "node" + ++nodeId;
  lowerRightDiv.setAttribute("id", lowerRightId);

  //creates lower-right node and adds it to the tree
  var lowerRightNode = new Node(nodeId, midX(node), node.minY, node.maxX, midY(node));
  node.children.push(lowerRightNode);

  //makes this div an inner node
  var nodeDiv = document.getElementById("node" + node.id);
  nodeDiv.classList.add("innernode");

  //displays children
  nodeDiv.appendChild(upperLeftDiv);
  nodeDiv.appendChild(upperRightDiv);
  nodeDiv.appendChild(lowerLeftDiv);
  nodeDiv.appendChild(lowerRightDiv);

  redistributePoints(node);
}


/**
 * Redistributes a node's points to its children.
 * If a child is over capacity after this process, that child is split.
 *
 * @param {Node} node The node whose points will be redistributed.
 */
function redistributePoints(node) {

  //add points to appropriate child
  for(var point of node.points) {

    //point is in upper half of this node
    if(point.y > midY(node)) {

      //point belongs in top-left child
      if(point.x < midX(node)) node.children[0].points.push(point);

      //point belongs in top-right child
      else node.children[1].points.push(point);
    }

    //point is in lower half of this node
    else {

      //point belongs in bottom-left child
      if(point.x < midX(node)) node.children[2].points.push(point);

      //point belongs in bottom-right child
      else node.children[3].points.push(point);
    }
  }

  //remove points from this node
  node.points.length = 0;

  //if all points were added to the same child, split that child
  if(node.children[0].points.length > nodeCapacity) splitNode(node.children[0]);
  else if(node.children[1].points.length > nodeCapacity) splitNode(node.children[1]);
  else if(node.children[2].points.length > nodeCapacity) splitNode(node.children[2]);
  else if(node.children[3].points.length > nodeCapacity) splitNode(node.children[3]);
}


/**
 * Searches the tree for point (x, y).
 * These values are taken from the text input on the webpage.
 */
function searchPointFromInput() {

  //don't run if another animation is in progress
  if(animationInProgress) return;

  //if points are currently hidden, display them and account for this delay
  var showPointsDelay = 0;
  if(pointsHidden){
    showPointsDelay = 1000;
    document.getElementById("hidepoints").checked = false;
    hidePoints();
  }

  setTimeout(function() {
    //signal start of animation
    animationInProgress = true;

    var xInput = document.getElementById("searchPointX").value;
    var yInput = document.getElementById("searchPointY").value;

    if(!validInt(xInput) || !validInt(yInput)){
      alert("X and Y must be integers between 1 and 99");
      animationInProgress = false;
      return;
    }

    searchPointAnimation(root, xInput, yInput);
  },
  showPointsDelay);
}


/**
 * Recursively animates the search process of the tree for point (x, y).
 *
 * @param {Node}    node The node whose subtree will be searched.
 * @param {integer} x    The point's x coordinate.
 * @param {integer} y    The points y coordinate.
 */
function searchPointAnimation(node, x, y) {

  var nodeDiv = document.getElementById("node" + node.id);
  //highlight this node
  nodeDiv.classList.add("backgroundtransition");
  nodeDiv.style.background = "#56B8D8";

  //wait 1.1s then un-highlight this node
  setTimeout(function() {
    nodeDiv.style.removeProperty("background");

    //wait 1.1s then move on to the next step of the search process
    setTimeout(function() {
      nodeDiv.classList.remove("backgroundtransition");

      //if this node has no children, this is the leaf node to search
      if(node.children.length == 0){
        searchPointInDivAnimation(node, x, y, 0);
      }

      //otherwise, we repeat this process with the proper child of this node
      else{
        //the coordinate is in the upper half of this node
        if(y > midY(node)) {

          //coordinate is in top-left child
          if(x < midX(node)) return searchPointAnimation(node.children[0], x, y);

          //coordinate is in top-right child
          else return searchPointAnimation(node.children[1], x, y);
        }

        //the coordinate is in lower half of this node
        else {

          //coordinate is in bottom-left child
          if(x < midX(node)) return searchPointAnimation(node.children[2], x, y);

          //coordinate is in bottom-right child
          else return searchPointAnimation(node.children[3], x, y);
        }
      }
    },
    1100);
  },
  1100);
}


/**
 * Recursively animates the search process of a leaf node for point (x, y).
 *
 * @param {Node}    node  The node whose points will be searched.
 * @param {integer} x     The point's x coordinate.
 * @param {integer} y     The points y coordinate.
 * @param {integer} index The first point to be checked.
 */
function searchPointInDivAnimation(node, x, y, index) {

  //the point was not found
  if(index == node.points.length) {
    alert("(" + x + ", " + y + ") is not in the tree");
    animationInProgress = false;

    //clear input
    document.getElementById("searchPointX").value = "";
    document.getElementById("searchPointY").value = "";

  }

  //the point is found
  else if(node.points[index].x == x && node.points[index].y == y){
    //highlight the coordinates
    var coordinatesDiv = document.getElementById("coordinates" + node.points[index].id);
    coordinatesDiv.style.background = "#E3E3E3";
    coordinatesDiv.style.color = "black";

    //highlight the point green
    var pointDiv = document.getElementById("point" + node.points[index].id);
    pointDiv.style.width = "16px";
    pointDiv.style.height = "16px";
    pointDiv.style.marginLeft = "-8px";
    pointDiv.style.marginBottom = "-8px";
    pointDiv.style.background = "green";

    //wait 1.6s
    setTimeout(function() {
      alert("(" + x + ", " + y + ") is in the tree");

      //un-highlight the point
      pointDiv.style.removeProperty("width");
      pointDiv.style.removeProperty("height");
      pointDiv.style.removeProperty("margin-left");
      pointDiv.style.removeProperty("margin-bottom");
      pointDiv.style.removeProperty("background");

      //un-highlight the coordinates
      coordinatesDiv.style.removeProperty("background");
      coordinatesDiv.style.removeProperty("color");

      //clear input
      document.getElementById("searchPointX").value = "";
      document.getElementById("searchPointY").value = "";

      animationInProgress = false;
    },
    1600);
  }

  //incorrect point
  else{
    //highlight the point yellow
    var pointDiv = document.getElementById("point" + node.points[index].id);
    pointDiv.style.width = "16px";
    pointDiv.style.height = "16px";
    pointDiv.style.marginLeft = "-8px";
    pointDiv.style.marginBottom = "-8px";
    pointDiv.style.background = "yellow";

    //wait 1.1s and un-highlight the point
    setTimeout(function() {
      pointDiv.style.removeProperty("width");
      pointDiv.style.removeProperty("height");
      pointDiv.style.removeProperty("margin-left");
      pointDiv.style.removeProperty("margin-bottom");
      pointDiv.style.removeProperty("background");

      //wait 1.1s and check the next point in the node
      setTimeout(function() {
        searchPointInDivAnimation(node, x, y, index + 1);
      },
      1100);
    },
    1100);
  }
}


/**
 * Searches the tree for points inside the rectangle (min x, min y), (max x, max y).
 * These values are taken from the text input on the webpage.
 */
function searchRectangleFromInput(){
  //don't run if another animation is in progress
  if(animationInProgress) return;

  var maxX = document.getElementById("searchRectMaxX").value;
  var maxY = document.getElementById("searchRectMaxY").value;
  var minX = document.getElementById("searchRectMinX").value;
  var minY = document.getElementById("searchRectMinY").value;

  if(!validInt(maxX) || !validInt(maxY) || !validInt(minX) || !validInt(minY)) {
    alert("X and Y values must be integers between 1 and 99");
    return;
  }

  //make sure max > min
  if(!(parseInt(maxX, 10) > parseInt(minX, 10)) ||
  !(parseInt(maxY, 10) > parseInt(minY, 10))){
    alert("Requirement:\nMax X > Min X\nMax Y > Min Y");
    return;
  }

  //display bounding rectangle
  var rect = document.getElementById("boundingrectangle");
  rect.style.height = (maxY - minY) + "%";
  rect.style.width = (maxX - minX) + "%";
  rect.style.bottom = minY + "%";
  rect.style.left = minX + "%";
  rect.style.visibility = "visible";
  rect.style.opacity = "100%";

  if(pointsHidden){
    document.getElementById("hidepoints").checked = false;
    hidePoints();
  }

  animationInProgress = true;

  /*
  find the amount of points that will be iterated over during this process
  this will be used to check when the animation is done
  */
  var pointsToIterate = pointsConsideredDuringRectSearch(root, minX, minY, maxX, maxY);
  var pointsIteratedOver = [];

  //wait 1.1s then start the search animation
  setTimeout(function() {
    searchRectangleAnimation(root, minX, minY, maxX, maxY, pointsToIterate, pointsIteratedOver);
  },
  1100);
}


/**
 * Recursively animates the tree's search process for points inside rectangle (min x, min y), (max x, max y).
 *
 * @param {Node}    node               The node whose subtree will be searched.
 * @param {integer} minX               The rectangle's minimum x coordinate.
 * @param {integer} minY               The rectangle's minimum y coordinate.
 * @param {integer} maxX               The rectangle's maximum x coordinate.
 * @param {integer} maxY               The rectangle's maximum y coordinate.
 * @param {integer} pointsToIterate    The amount of points that will be considered during this processing.
 * @param {array}   pointsIteratedOver The amount of points already considered.
 */
function searchRectangleAnimation(node, minX, minY, maxX, maxY, pointsToIterate, pointsIteratedOver){

  var nodeDiv = document.getElementById("node" + node.id);
  nodeDiv.classList.add("backgroundtransition");

  //if the rectangle doesn't intersect with this node, turn this node red
  if(!rectanglesIntersect(minX, minY, maxX, maxY, node.minX, node.minY, node.maxX, node.maxY)){
    nodeDiv.style.background = "#AC4343";
    return;
  }

  //if this is a leaf node, turn it green
  if(node.children.length == 0){
    nodeDiv.style.background = "green";

    //wait 1.1s then search the points in this node
    setTimeout(function() {
      searchRectLeafNodeAnimation(node, minX, minY, maxX, maxY, 0, pointsToIterate, pointsIteratedOver);
    },
    1100);
  }

  //if the node has children highlight this node
  else{
    nodeDiv.style.background = "#56B8D8";

    //wait 1.1s then un-highlight this node
    setTimeout(function() {
      nodeDiv.style.removeProperty("background");

      //wait 1.1s and repeat this process with each of this node's children
      setTimeout(function(){
        for(var child of node.children){
          searchRectangleAnimation(child, minX, minY, maxX, maxY, pointsToIterate, pointsIteratedOver);
        }
      },
      1100)
    },
    1100);
  }
}


/**
 * Recursively animates a leaf node's search process for points inside rectangle (min x, min y), (max x, max y).
 *
 * @param {Node}    node               The node whose subtree will be searched.
 * @param {integer} minX               The rectangle's minimum x coordinate.
 * @param {integer} minY               The rectangle's minimum y coordinate.
 * @param {integer} maxX               The rectangle's maximum x coordinate.
 * @param {integer} maxY               The rectangle's maximum y coordinate.
 * @param {integer} index              The first point to be checked.
 * @param {integer} pointsToIterate    The amount of points that will be considered during this processing.
 * @param {array}   pointsIteratedOver The amount of points already considered.
 */
function searchRectLeafNodeAnimation(node, minX, minY, maxX, maxY, index, pointsToIterate, pointsIteratedOver) {

  if(index == node.points.length){
    rectangleSearched(pointsToIterate, pointsIteratedOver);
    return;
  }

  //point is in the rectangle
  if(parseInt(node.points[index].x, 10) >= parseInt(minX, 10) &&
   parseInt(node.points[index].x, 10) <= parseInt(maxX, 10) &&
   parseInt(node.points[index].y, 10) >= parseInt(minY, 10) &&
   parseInt(node.points[index].y, 10) <= parseInt(maxY, 10)){

    //highlight coordinate
    var coordinatesDiv = document.getElementById("coordinates" + node.points[index].id);
    coordinatesDiv.style.background = "#E3E3E3";
    coordinatesDiv.style.color = "black";

    //highlight point green
    var pointDiv = document.getElementById("point" + node.points[index].id);
    pointDiv.style.width = "10px";
    pointDiv.style.height = "10px";
    pointDiv.style.marginLeft = "-5px";
    pointDiv.style.marginBottom = "-5px";
    pointDiv.style.background = "#4AB84A";
  }

  //point is not in the rectangle
  else{

    //highlight point yellow
    var pointDiv = document.getElementById("point" + node.points[index].id);
    pointDiv.style.width = "10px";
    pointDiv.style.height = "10px";
    pointDiv.style.marginLeft = "-5px";
    pointDiv.style.marginBottom = "-5px";
    pointDiv.style.background = "yellow";

    //wait 1.1s then un-highlight point
    setTimeout(function() {
      pointDiv.style.removeProperty("width");
      pointDiv.style.removeProperty("height");
      pointDiv.style.removeProperty("margin-left");
      pointDiv.style.removeProperty("margin-bottom");
      pointDiv.style.removeProperty("background");
    },
    1100);
  }

  //wait 2.2s
  setTimeout(function(){
    //record that this point has been iterated over
    pointsIteratedOver.push(node.points[index]);

    //repeat this process with the next point in the node
    searchRectLeafNodeAnimation(node, minX, minY, maxX, maxY, index + 1, pointsToIterate, pointsIteratedOver);
  },
  2200);
}


/**
 * Resets the tree on the webpage once a rectangle search is complete.
 *
 * @param {integer} pointsToIterate    The amount of points that will be considered during this processing.
 * @param {array}   pointsIteratedOver The amount of points already considered.
 */
function rectangleSearched(pointsToIterate, pointsIteratedOver){

  //check if the animation is done
  if(pointsToIterate != pointsIteratedOver.length) return;

  //wait 3s
  setTimeout(function(){
    //clear x and y input
    document.getElementById("searchRectMaxX").value = "";
    document.getElementById("searchRectMaxY").value = "";
    document.getElementById("searchRectMinX").value = "";
    document.getElementById("searchRectMinY").value = "";

    //un-highlight all points
    for(var point of points){
      var pointDiv = document.getElementById("point" + point.id);
      pointDiv.style.removeProperty("width");
      pointDiv.style.removeProperty("height");
      pointDiv.style.removeProperty("margin-left");
      pointDiv.style.removeProperty("margin-bottom");
      pointDiv.style.removeProperty("background");
    }

    //hide bounding rectangle
    var boundingRect = document.getElementById("boundingrectangle");
    boundingRect.style.removeProperty("opacity");
    boundingRect.style.removeProperty("visibility");

    //remove color from all nodes
    var root = document.getElementById("node0");
    root.style.removeProperty("background");
    var nodes = document.getElementsByClassName("quadtreenode");
    for(var node of nodes){
      node.style.removeProperty("background");
    }

    //un-highlight all coordinates
    for(var point of points){
      var coordinatesDiv = document.getElementById("coordinates" + point.id);
      coordinatesDiv.style.removeProperty("background");
      coordinatesDiv.style.removeProperty("color");
    }

    //wait 1s
    setTimeout(function(){
      //remove background transitions from all nodes
      root.classList.remove("backgroundtransition");
      for(var node of nodes){
        node.classList.remove("backgroundtransition");
      }

      animationInProgress = false;
    },
    1000);
  },
  3000);
}


/**
 * Changes the leaf node capacity of the tree.
 * Restructures the Quad Tree data structure and the tree on the webpage to reflect this.
 *
 * @param {integer} newCapacity The new capacity for a leaf node.
 */
function changeNodeCapacity(newCapacity) {

  if(newCapacity == nodeCapacity) return;

  if(animationInProgress) {
    document.getElementById("capacity" + nodeCapacity).checked = true;
    return;
  }

  nodeCapacity = newCapacity;
  var tempPoints = Array.from(points);
  eraseTree();

  animationInProgress = true;

  for(var point of tempPoints){
    addPointFromParameters(point.x, point.y);
  }

  animationInProgress = false;
}


/**
 * Hides the points on the webpage.
 */
function hidePoints() {

  if(animationInProgress) {
    document.getElementById("hidepoints").checked = pointsHidden;
    return;
  }

  var pointDivs = document.getElementsByClassName("point");

  for(var pointDiv of pointDivs) {
    if(pointsHidden){
      pointDiv.style.removeProperty("opacity");
      pointDiv.style.removeProperty("visibility");
    }
    else {
      pointDiv.style.opacity = "0%";
      pointDiv.style.visibility = "hidden";
    }
  }

  pointsHidden = !pointsHidden;
}


/**
 * Removes the most recent point from the tree.
 * Restructures the Quad Tree data structure and the tree on the webpage to reflect this.
 */
function removeLastPoint() {

  if(animationInProgress) return;

  var tempPoints = Array.from(points);

  //remove last point
  tempPoints.pop();

  eraseTree();

  animationInProgress = true;

  for(var point of tempPoints){
    addPointFromParameters(point.x, point.y);
  }

  animationInProgress = false;
}


/**
 * Removes all points from the tree.
 * Restructures the Quad Tree data structure and the tree on the webpage to reflect this.
 */
function eraseTree() {

  if(animationInProgress) return;

  //reset global counters
  nodeId = 0;
  pointId = 0;

  //removes all root's children from tree
  root.children.length = 0;
  root.points.length = 0;
  points.length = 0;

  //clear everything on the stage
  var stage = document.getElementById("stage");
  stage.innerHTML = "";

  //clear all coordinates
  var coordinatesDiv = document.getElementById("coordinatepanel");
  coordinatesDiv.innerHTML = "";

  //add the root node div back;
  var rootNodeDiv = document.createElement("div");
  rootNodeDiv.setAttribute("class", "quadtreerootnode");
  rootNodeDiv.setAttribute("id", "node0");
  stage.appendChild(rootNodeDiv);

  //add the bounding rectengle div back;
  var boundingRectDiv = document.createElement("div");
  boundingRectDiv.setAttribute("class", "boundingrectangle");
  boundingRectDiv.setAttribute("id", "boundingrectangle");
  stage.appendChild(boundingRectDiv);

  updateTreeStats();
  displayTreeStats();
}


/**
 * Updates global stats variables.
 */
function updateTreeStats(){
  depthCount = getDepth(root);
  nodeCount = getNodeCount(root);
  leafNodeCount = getLeafNodeCount(root);
}


/**
 * Recursively finds the depth of a node's subtree.
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @return {integer}      The depth of the subtree.
 */
function getDepth(node){

  //if this is a leaf node, return 0
  if(node.children.length == 0) return 0;

  //return the maximum depth of this node's children + 1
  return Math.max(getDepth(node.children[0]), getDepth(node.children[1]),
  getDepth(node.children[2]), getDepth(node.children[3])) + 1;
}


/**
 * Recursively finds the amount of nodes in a node's subtree.
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @return {integer}      The amount of nodes in the subtree.
 */
function getNodeCount(node){

  //if this is a leaf node, return 1
  if(node.children.length == 0) return 1;

  //return sum descendant nodes + 1
  return getNodeCount(node.children[0]) + getNodeCount(node.children[1]) +
  getNodeCount(node.children[2]) + getNodeCount(node.children[3]) + 1;
}


/**
 * Recursively finds the amount of leaf nodes in a node's subtree.
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @return {integer}      The amount of leaf nodes in the subtree.
 */
function getLeafNodeCount(node){

  //if this is a leaf node, return 1
  if(node.children.length == 0) return 1;

  //return sum of descendant leaf nodes
  return getLeafNodeCount(node.children[0]) +
  getLeafNodeCount(node.children[1]) +
  getLeafNodeCount(node.children[2]) +
  getLeafNodeCount(node.children[3]);
}


/**
 * Displays the tree stats on the webpage.
 */
function displayTreeStats(){

  var depthDisplay = document.getElementById("depth");
  depthDisplay.innerHTML = depthCount;

  var nodesDisplay = document.getElementById("nodes");
  nodesDisplay.innerHTML = nodeCount;

  var leafnodesDisplay = document.getElementById("leafnodes");
  leafnodesDisplay.innerHTML = leafNodeCount;

  var pointsDisplay = document.getElementById("points");
  pointsDisplay.innerHTML = points.length;
}


/**
 * Highlights a point and its coordinates on the webpage.
 *
 * @param {integer} id The point's ID.
 */
function highlightPoint(id){

  if(animationInProgress) return;

  //if points are currently hidden, display them and account for this delay
  var showPointsDelay = 0;
  if(pointsHidden){
    showPointsDelay = 1000;
    document.getElementById("hidepoints").checked = false;
    hidePoints();
  }

  //highlight coordinates
  var coordinatesDiv = document.getElementById("coordinates" + id);
  coordinatesDiv.style.background = "#E3E3E3";
  coordinatesDiv.style.color = "black";

  setTimeout(function() {
    animationInProgress = true;

    //highlight point green
    var pointDiv = document.getElementById("point" + id);
    pointDiv.style.width = "16px";
    pointDiv.style.height = "16px";
    pointDiv.style.marginLeft = "-8px";
    pointDiv.style.marginBottom = "-8px";
    pointDiv.style.background = "green";

    //wait 1.5s then un-highlight point and coordinates
    setTimeout(function() {
      pointDiv.style.removeProperty("width");
      pointDiv.style.removeProperty("height");
      pointDiv.style.removeProperty("margin-left");
      pointDiv.style.removeProperty("margin-bottom");
      pointDiv.style.removeProperty("background");
      coordinatesDiv.style.removeProperty("background");
      coordinatesDiv.style.removeProperty("color");
      animationInProgress = false;
    },
    1500);
  },
  showPointsDelay);
}


/**
 * Calculates the middle x value of a node.
 *
 * @param  {Node}   node The node.
 * @return {number}      The node's middle x value.
 */
function midX(node) {
  return (node.maxX + node.minX) / 2;
}


/**
 * Calculates the middle y value of a node.
 *
 * @param  {Node}   node The node.
 * @return {number}      The node's middle y value.
 */
function midY(node) {
  return (node.maxY + node.minY) / 2;
}


/**
 * Calculates whether two rectangles intersect.
 *
 * @param  {integer} minX1 The first rectangle's minimum x coordinate.
 * @param  {integer} minY1 The first rectangle's minimum y coordinate.
 * @param  {integer} maxX1 The first rectangle's maximum x coordinate.
 * @param  {integer} maxY1 The first rectangle's maximum y coordinate.
 * @param  {integer} minX2 The second rectangle's minimum x coordinate.
 * @param  {integer} minY2 The second rectangle's minimum y coordinate.
 * @param  {integer} maxX2 The second rectangle's maximum x coordinate.
 * @param  {integer} maxY2 The second rectangle's maximum y coordinate.
 * @return {boolean}       True if the recangles intersect, otherwise, false.
 */
function rectanglesIntersect(minX1, minY1, maxX1, maxY1, minX2, minY2, maxX2, maxY2){
  //bottom of the first rectangle is above the top of second rectangle
  if(minX1 > maxX2) return false;
  //bottom of the second rectangle is above the top of first rectangle
  if(minX2 > maxX1) return false;
  //left side of the first rectangle is to the right of the right side of the second rectangle
  if(minY1 > maxY2) return false;
  //left side of the second rectangle is to the right of the right side of the first rectangle
  if(minY2 > maxY1) return false;
  //if none of the above are true, the rectangles intersect
  return true;
}


/**
 * Recursively calculates the amount of points considered during a bounding rectangle search.
 *
 * @param  {Node}    node The node whose subtree will be searched.
 * @param  {integer} minX The rectangle's minimum x coordinate.
 * @param  {integer} minY The rectangle's minimum y coordinate.
 * @param  {integer} maxX The rectangle's maximum x coordinate.
 * @param  {integer} maxY The rectangle's maximum y coordinate.
 * @return {integer}      The number of points considered.
 */
function pointsConsideredDuringRectSearch(node, minX, minY, maxX, maxY){

  //if the rectangles don't intersect no points within the rectangle will be considered
  if(!rectanglesIntersect(minX, minY, maxX, maxY, node.minX, node.minY, node.maxX, node.maxY)) return 0;

  //otherwise, if this is a leaf node all points inside it will be considered
  if(node.children.length == 0){
    return node.points.length;
  }

  //otherwise, if repeat this process with all this node's children
  return pointsConsideredDuringRectSearch(node.children[0], minX, minY, maxX, maxY) +
  pointsConsideredDuringRectSearch(node.children[1], minX, minY, maxX, maxY) +
  pointsConsideredDuringRectSearch(node.children[2], minX, minY, maxX, maxY) +
  pointsConsideredDuringRectSearch(node.children[3], minX, minY, maxX, maxY);
}


/**
 * Determines whether an input is an integer between 1 and 99.
 *
 * @param  {string}  input The string to be tested.
 * @return {boolean}       True it it's an integer between 1 and 99, otherwise, false.
 */
function validInt(input) {

  if(input.length < 1 || input.length > 2) return false;

  for(var i = 0; i < input.length; i++) {
    var c = input.charAt(i);

    //first character cannot be 0
    if(i == 0 && c == "0") return false;

    //characters must be from 0 to 9
    if(c != "0" && c!= "1" && c!= "2" && c!= "3" && c!= "4" && c!= "5" &&
     c!= "6" && c!= "7" && c!= "8" && c!= "9") return false;
  }

  return true;
}
