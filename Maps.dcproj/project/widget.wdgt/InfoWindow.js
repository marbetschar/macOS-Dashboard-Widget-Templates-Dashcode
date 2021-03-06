/* 
 This file was generated by Dashcode.  
 You may edit this file to customize your widget or web page 
 according to the license.txt file included in the project.
 */

// Create an Info Window at a certain point and offset
function InfoWindow(thisMap, infoDiv)
{
    // put all custom properties inside the properties_ object to avoid collision
    this.properties_ = new Object();
    this.properties_.isVisible = false;

    // get a reference to the map
    this.properties_.map = thisMap;
    this.properties_.mapDiv = thisMap.getContainer();

    // get a reference to DOM elements
    this.properties_.div = infoDiv;
    this.properties_.contentsParentDiv = document.getElementById("infoContentsParent");
    this.properties_.titleDiv = document.getElementById("infoTitle");
    this.properties_.titleBgDiv = document.getElementById("infoTitleBg");
    this.properties_.tailDiv = document.getElementById("infoTail");
    this.properties_.topDiv1 = document.getElementById("infoTop1");
    this.properties_.topDiv2 = document.getElementById("infoTop2");
    this.properties_.bottomDiv1 = document.getElementById("infoBottom1");
    this.properties_.bottomDiv2 = document.getElementById("infoBottom2");

    // full screen DOM elements
    this.properties_.fullDiv = document.getElementById("fullInfoWindow");
    this.properties_.fullTitleDiv = document.getElementById("fullInfoTitle");
    this.properties_.fullContentsDiv = document.getElementById("fullContents");
    this.properties_.fullContentsScroll = document.getElementById("fullContentsScroll");
    this.properties_.fullContentsNoScroll = document.getElementById("fullContentsNoScroll");
    
    // check that all required elements are present
    if (!infoDiv || !this.properties_.titleDiv || !this.properties_.titleBgDiv
        || !this.properties_.tailDiv || !this.properties_.topDiv1 || !this.properties_.topDiv2 
        || !this.properties_.bottomDiv1 || !this.properties_.bottomDiv2) {
        return null;
    }

    // Configuration values
    this.properties_.fadeDuration = 400;
    this.properties_.alwaysOnTop = false;
    this.properties_.minWidth = 100;
    this.properties_.minHeight = 80;
    this.properties_.preferredWidth = 424;
    this.properties_.maxWidth = Math.min(600, this.properties_.mapDiv.offsetWidth);
    this.properties_.maxHeight = Math.round(this.properties_.mapDiv.offsetHeight * .5);
    this.properties_.preferredHeight = this.properties_.maxHeight;
    this.properties_.minTailMargin = 19;
    this.properties_.tailShadowHeight = 5;
    this.properties_.lineHeight = 15;
    this.properties_.contentsParentBottom = parseInt(document.defaultView.getComputedStyle(this.properties_.contentsParentDiv).getPropertyValue("bottom"));

    // Update the opacity during fade in/out
    var _self = this;
    this.updateOpacity = function(animation, current, start, finish) {
        _self.properties_.div.style.opacity = current;
    }

    // Update the opacity to show/hide full screen
    this.updateOpacityFull = function(animation, current, start, finish) {
        _self.properties_.div.style.opacity = 1 - current;
        _self.properties_.fullDiv.style.opacity = current;
    }
}

// Declare as subclass of GOverlay to be able to overlay it over the map
if (typeof(GOverlay) != "undefined") {
    InfoWindow.prototype = new GOverlay();
}

// Initialize the Info Window for a certain map
InfoWindow.prototype.initialize = function(thisMap)
{
    // add the div to the map
    thisMap.getPane(G_MAP_FLOAT_PANE).appendChild(this.properties_.div);
}

// Redraw the info window based on the current projection and zoom level
InfoWindow.prototype.redraw = function(force) {
    if (!force || !this.isVisible()) return;

    // local variables
    var thisMap = this.properties_.map;
    var shouldPanMap = false;
    var panTo = thisMap.fromLatLngToDivPixel(thisMap.getCenter());
    var mapWidth = this.properties_.mapDiv.offsetWidth;
    var mapHeight = this.properties_.mapDiv.offsetHeight;
    var infoWindowWidth = this.properties_.div.offsetWidth;
    var infoWindowHeight = this.properties_.div.offsetHeight;
    var tailWidth = this.properties_.tailDiv.offsetWidth;
    var tailHeight = this.properties_.tailDiv.offsetHeight;
    var leftRightMargin = this.properties_.bottomDiv1.offsetLeft;
    var topMargin = this.properties_.topDiv1.offsetHeight;
    var bottomMargin = this.properties_.bottomDiv1.offsetHeight;

    // values to be calculated
    var tailTop;
    var tailLeft;
    var tailBackground;
    var infoWindowTop;
    var infoWindowLeft;
    var top1Width;
    var top2Left;
    var bottom1Width;
    var bottom2Left;
    
    // find the top left corner of the map
    var mapDivOffset = this.mapDivOffset();
    
    // Calculate the anchor point, using offset from the marker
    this.properties_.pixelsPoint = this.properties_.map.fromLatLngToDivPixel(this.properties_.latLongPoint);
    var markerAnchor =  new GPoint(this.properties_.pixelsPoint.x, this.properties_.pixelsPoint.y);
    markerAnchor.x -= this.properties_.offsetPixels.x;
    markerAnchor.y -= this.properties_.offsetPixels.y;
    
    // initially center info window and tail horizontally
    var infoWindowHalfWidth = infoWindowWidth / 2;
    infoWindowLeft = Math.round(markerAnchor.x - infoWindowHalfWidth);
    tailLeft = Math.round(infoWindowHalfWidth - (tailWidth / 2));

    // if it is not totally visible horizontally
    var infoWindowLeftExtra = mapDivOffset.x - infoWindowLeft;
    var infoWindowRightExtra = (infoWindowLeft + infoWindowWidth) - (mapDivOffset.x + mapWidth);
    if (infoWindowLeftExtra > 0) {
        // move the window to the right
        infoWindowLeft += infoWindowLeftExtra;
        tailLeft -= infoWindowLeftExtra;
        // if it is too much, pan horizontally
        var tailLeftExtra = this.properties_.minTailMargin - tailLeft;
        if (tailLeftExtra > 0) {
            tailLeft += tailLeftExtra;
            infoWindowLeft -= tailLeftExtra;
            shouldPanMap = true;
            panTo.x -= tailLeftExtra;
        }
    }
    // if it doesn't fit on the right side
    else if(infoWindowRightExtra > 0) {
        // move the window to the left
        infoWindowLeft -= infoWindowRightExtra;
        tailLeft += infoWindowRightExtra;
        // if it is too much, pan horizontally
        var tailRightExtra = (tailLeft + tailWidth) - (infoWindowWidth - this.properties_.minTailMargin);
        if (tailRightExtra > 0) {
            tailLeft -= tailRightExtra;
            infoWindowLeft += tailRightExtra;
            shouldPanMap = true;
            panTo.x += tailRightExtra;
        }
    }
        
    // calculate the vertical position of the window
    if (this.properties_.onTop) {
        // position and background of the tail
        tailBackground = "url(Images/infoTailDown.png)";
        tailTop = infoWindowHeight - bottomMargin;
        // position of the window, compensating for tail shadow height
        infoWindowTop = markerAnchor.y - tailHeight - tailTop;
        infoWindowTop += this.properties_.tailShadowHeight;
        // determine if we need vertical panning
        var infoWindowTopExtra = mapDivOffset.y - infoWindowTop;
        if (infoWindowTopExtra > 0) {
            shouldPanMap = true;
            panTo.y -= infoWindowTopExtra;
        }
        // calculate the position and width of top border and shadow
        top1Width = infoWindowWidth - (leftRightMargin * 2);
        top2Left = top1Width + leftRightMargin;
        // calculate the position and width of bottom border and shadow
        bottom1Width = tailLeft - leftRightMargin;
        bottom2Left = tailLeft + tailWidth;
    }
    // if it is on the bottom
    else {  
        // position and background of tail
        tailBackground = "url(Images/infoTailUp.png)";
        tailTop = topMargin - tailHeight;
        // position of the window, compensating for tail shadow height
        infoWindowTop = markerAnchor.y + tailHeight - topMargin;
        infoWindowTop -= this.properties_.tailShadowHeight;
        // determine if we need vertical panning
        var infoWindowTopExtra = (infoWindowTop + infoWindowHeight) - (mapDivOffset.y + mapHeight);
        if (infoWindowTopExtra > 0) {
            shouldPanMap = true;
            panTo.y += infoWindowTopExtra;
        }
        // calculate the position and width of top border and shadow
        top1Width = tailLeft - leftRightMargin;
        top2Left = tailLeft + tailWidth;
        // calculate the position and width of bottom border and shadow
        bottom1Width = infoWindowWidth - (leftRightMargin * 2);
        bottom2Left = bottom1Width + leftRightMargin;
    }

    // pan the map if needed
    if (shouldPanMap) {
        thisMap.panTo(thisMap.fromDivPixelToLatLng(panTo));
    }
    
    // move and resize all the elements
    this.properties_.div.style.left = infoWindowLeft + "px";
    this.properties_.div.style.top = infoWindowTop + "px";
    this.properties_.tailDiv.style.backgroundImage = tailBackground;
    this.properties_.tailDiv.style.top = tailTop + "px";
    this.properties_.tailDiv.style.left = tailLeft + "px";
    this.properties_.topDiv1.style.width = top1Width + "px";
    this.properties_.topDiv2.style.left = top2Left + "px";
    this.properties_.bottomDiv1.style.width = bottom1Width + "px";
    this.properties_.bottomDiv2.style.left = bottom2Left + "px";
}

// Set the contents of the info window
InfoWindow.prototype.setContents = function(info, reformatContent) {
    var titleDiv = this.properties_.titleDiv;
    var contentsParentDiv = this.properties_.contentsParentDiv;
    this.properties_.reformatContent = reformatContent;

    // remove old divs
    if (this.properties_.contentsDiv) {
        this.properties_.contentsDiv.parentNode.removeChild(this.properties_.contentsDiv);
    }
    if (this.properties_.contentsImageDiv) {
        this.properties_.contentsImageDiv.parentNode.removeChild(this.properties_.contentsImageDiv);
    }
    while (contentsParentDiv.childNodes.length) {
        contentsParentDiv.removeChild(contentsParentDiv.firstChild);
    }

    // create the contents divs
    var contentsDiv = document.createElement("div");
    contentsDiv.className = "infoContents";
    contentsParentDiv.appendChild(contentsDiv);
    var contentsImageDiv = document.createElement("div");
    contentsImageDiv.className = "infoWindowImage";
    this.properties_.div.appendChild(contentsImageDiv);
    this.properties_.contentsDiv = contentsDiv;
    this.properties_.contentsImageDiv = contentsImageDiv;

    // set the title
    titleDiv.innerHTML = "";
    if (info.link && info.link.length) {
        var linkElement = document.createElement("a");
        linkElement.setAttribute("href", info.link);
        if (typeof info.name == "string") {
            linkElement.innerHTML = info.name;
        }
        else {
            linkElement.appendChild(info.name);
        }
        titleDiv.appendChild(linkElement);
    }
    else {
        if (typeof info.name == "string") {
            titleDiv.innerHTML = info.name;
        }
        else {
            titleDiv.appendChild(info.name);
        }
    }
    
    // set the description
    if (typeof info.description == "string") {
        contentsDiv.innerHTML = info.description;
    }
    else {
        contentsDiv.innerHTML = "";
        contentsDiv.appendChild(info.description);
    }

    // set the initial window size to the preferred one
    var infoWindowWidth = Math.min(this.properties_.preferredWidth, this.properties_.maxWidth);
    var infoWindowHeight = Math.min(this.properties_.preferredHeight, this.properties_.maxHeight);
    this.properties_.div.style.width = infoWindowWidth + "px";
    this.properties_.div.style.height = infoWindowHeight + "px";
    contentsParentDiv.style.bottom = this.properties_.contentsParentBottom + "px";

    // if the content will be reformatted
    var hasImage = false;
    if (reformatContent) {
        hasImage = this.reformatContent(contentsDiv, contentsParentDiv, null, contentsImageDiv);
    }

    // fix the links so they open in the browser
    fixLinks(titleDiv);
    fixLinks(contentsDiv);
    
    // adjust the height
    var contentsHeightExtra = contentsParentDiv.offsetHeight - contentsDiv.offsetHeight;
    if (!hasImage && contentsHeightExtra > 0) {
        infoWindowHeight -= contentsHeightExtra;
        infoWindowHeight = Math.max(infoWindowHeight, this.properties_.minHeight);
        this.properties_.div.style.height = infoWindowHeight + "px";
    }

    // adjust the width
    var contentsWidthExtra = contentsParentDiv.offsetWidth - contentsDiv.offsetWidth;
    if (contentsWidthExtra > 0) {
        infoWindowWidth -= contentsWidthExtra;
        infoWindowWidth = Math.max(infoWindowWidth, this.properties_.minWidth);
        this.properties_.div.style.width = infoWindowWidth + "px";
        // make sure the title is not cropped unnecessarily
        var titleWidthExtra = titleDiv.scrollWidth - titleDiv.offsetWidth;
        if (titleWidthExtra > 0) {
            infoWindowWidth += titleWidthExtra + 5;
            infoWindowWidth = Math.min(infoWindowWidth, this.properties_.maxWidth);
            this.properties_.div.style.width = infoWindowWidth + "px";
        }
    }

    // if the content is too long, show Read more... link
    var readMoreDiv = document.getElementById("readMore");
    if (contentsDiv.offsetHeight > contentsParentDiv.offsetHeight) {
        readMoreDiv.style.visibility = "visible";
        contentsParentDiv.style.bottom = (infoWindowHeight - readMoreDiv.offsetTop) + "px";
        _contentsDivToAdjustLines = contentsDiv;
        setTimeout("adjustLines()", 10);
    } else {
        readMoreDiv.style.visibility = "hidden";
        _contentsDivToAdjustLines = null;
    }
}

function adjustLines() {
    var clamp = 100;
    var contentsDiv = _contentsDivToAdjustLines;
    if (contentsDiv) {
        var contentsParentDiv = contentsDiv.parentNode;
        while (contentsDiv.offsetHeight > contentsParentDiv.offsetHeight) {
            clamp -= 5;
            if (clamp < 5) break;
            contentsDiv.style.khtmlLineClamp = clamp+"%";
        }
    }
}

// Reformat content inside a div
InfoWindow.prototype.reformatContent = function(contentsDiv, sizeReferenceDiv, scrollArea, contentsImageDiv) {
    // this reformatting will remove all the images except for the first one
    // that image will be resized to fit the window and positioned at the top right corner

    // remove all images except the first one
    var hasImages = false;
    var images = contentsDiv.getElementsByTagName("img");
    while (images.length > 1) {
        images[1].parentNode.removeChild(images[1]);
    }

    // resize and reposition first image
    if (images.length > 0) {
        hasImages = true;
        var firstImage = images[0];
        firstImage.onload = function(event) {
            // make sure the image is still in the DOM tree
            var thisImage = event.currentTarget;
            if (!thisImage.parentNode || !thisImage.parentNode.parentNode) {
                return;
            }
        
            // calculate the max size of the image
            var maxImgWidth = sizeReferenceDiv.offsetWidth * .45;
            var maxImgHeight = sizeReferenceDiv.offsetHeight - 1;

            // resize the image
            var aspectRatio = thisImage.width / thisImage.height;
            if (thisImage.height > maxImgHeight) {
                thisImage.height = maxImgHeight;
                thisImage.width = maxImgHeight * aspectRatio;
            }
            if (thisImage.width > maxImgWidth) {
                thisImage.width = maxImgWidth;
                thisImage.height = maxImgWidth / aspectRatio;
            }
            // show the image
            thisImage.style.display = "block";
            thisImage.style.cursor = "pointer";

            // resize the divs
            if (contentsImageDiv) {
                contentsImageDiv.style.width = thisImage.width + "px";
                contentsDiv.style.width = (contentsDiv.offsetWidth - contentsImageDiv.offsetWidth) + "px";
                // link to full screen mode
                if (typeof(showFullScreen) != "undefined") {
                    thisImage.addEventListener("click", showFullScreen, false);
                }
            }
            else {
                // link to full screen mode
                if (typeof(showFullScreenImage) != "undefined") {
                    thisImage.addEventListener("click", showFullScreenImage, false);
                }
            }
            // refresh the scroll area
            if (scrollArea) {
                scrollArea.object.verticalScrollTo(0);
                scrollArea.object.refresh();
            }
            // adjust lines
            _contentsDivToAdjustLines = contentsDiv;
            setTimeout("adjustLines()", 10);
        }

        // hide it for now
        firstImage.style.display = "none";
        
        // reposition the image
        if (contentsImageDiv) {
            contentsImageDiv.appendChild(firstImage);
        }
        else {
            var imgDiv = document.createElement("div");
            imgDiv.appendChild(firstImage);
            imgDiv.className = "infoFullImage";
            contentsDiv.insertBefore(imgDiv, contentsDiv.firstChild);
        }
    }
    
    return hasImages;
}

// Show the info window attached to a marker
InfoWindow.prototype.show = function(marker, reformatContents) {
    // save the original position and marker
    this.properties_.marker = marker;
    this.properties_.latLongPoint = marker.getPoint();
    this.properties_.pixelsPoint = this.properties_.map.fromLatLngToDivPixel(this.properties_.latLongPoint);

    // set the contents
    this.setContents(marker.metaInfo_, reformatContents);

    // get the marker position relative to the parent div
    var markerCenter = new GPoint(this.properties_.pixelsPoint.x, this.properties_.pixelsPoint.y);
    var mapDivOffset = this.mapDivOffset();
    markerCenter.x -= mapDivOffset.x;
    markerCenter.y -= mapDivOffset.y;

    // anchor point for the info window relative to the top left corner of the icon
    var iconAnchor = marker.getIcon().iconAnchor;
    var infoAnchor = marker.getIcon().infoWindowAnchor;
    infoAnchor = new GPoint(infoAnchor.x, infoAnchor.y); 

    // determine if the window will be on the top or bottom
    this.properties_.onTop = true;
    if (!this.properties_.alwaysOnTop && markerCenter.y < this.properties_.mapDiv.offsetHeight / 2) {
        this.properties_.onTop = false;
        // move info anchor to bottom of icon
        infoAnchor.y = marker.getIcon().iconSize.height;
    }

    // determine the offset of the info window with respect to the marker anchor point
    this.properties_.offsetPixels = new GPoint(iconAnchor.x - infoAnchor.x, iconAnchor.y - infoAnchor.y);
    
    // make the info window visible and fade it in
    if (!this.isVisible()) {
        this.properties_.isVisible = true;
        this.properties_.div.style.opacity = 0;
        this.properties_.div.style.visibility = "visible";
        var animator = new AppleAnimator(this.properties_.fadeDuration, 13, 0, 1, this.updateOpacity);
        map.addOverlay(infoWindow);
        animator.start();
    }
    else {
        this.redraw(true);
    }
}

// Hide the info window
InfoWindow.prototype.remove = function() {
    // fade out the infow window and hide it
    if (this.isVisible()) {
        this.properties_.isVisible = false;
        var animator = new AppleAnimator(this.properties_.fadeDuration, 13, 1, 0, this.updateOpacity);
        var _self = this;
        animator.oncomplete = function() {
            _self.properties_.div.style.visibility = "hidden";
            map.removeOverlay(infoWindow);
        }
        animator.start();
    }
}

// Show the info window as full screen
InfoWindow.prototype.showFullScreen = function() {
    // to go to ful screen, it first has to be visible
    if (!this.isVisible()) {
        return false;
    }
    
    // local variables
    var contentsDiv = this.properties_.fullContentsDiv;
    var scrollArea = this.properties_.fullContentsScroll;
    var noScrollDiv = this.properties_.fullContentsNoScroll;
    var info = this.properties_.marker.metaInfo_;
    
    // set the title and description
    this.properties_.fullTitleDiv.innerHTML = this.properties_.titleDiv.innerHTML;
    if (typeof info.description == "string") {
        contentsDiv.innerHTML = info.description;
    }
    else {
        contentsDiv.innerHTML = "";
        contentsDiv.appendChild(info.description);
    }

    // if the content will be reformatted
    if (this.properties_.reformatContent) {
        this.reformatContent(contentsDiv, scrollArea, scrollArea, null);
    }

    // fix the links so they open in the browser
    fixLinks(this.properties_.fullTitleDiv);
    fixLinks(contentsDiv);
    
    // refresh the scroll area
    scrollArea.object.verticalScrollTo(0);
    scrollArea.object.refresh();
    
    // show the full screen div, hide the info window
    noScrollDiv.style.visibility = "hidden";
    scrollArea.style.visibility = "visible";
    var fullVisibility = document.defaultView.getComputedStyle(this.properties_.fullDiv).getPropertyValue("visibility");
    if (fullVisibility == "hidden") {
        this.properties_.fullDiv.style.opacity = 0;
        this.properties_.fullDiv.style.visibility = "visible";
        var animator = new AppleAnimator(this.properties_.fadeDuration, 13, 0, 1, this.updateOpacityFull);
        animator.start();
    }
}

// Show the info window as full screen for an image
InfoWindow.prototype.showFullScreenImage = function() {
    // to go to ful screen, it first has to be visible
    if (!this.isVisible()) {
        return false;
    }
    
    // local variables
    var scrollArea = this.properties_.fullContentsScroll;
    var noScrollDiv = this.properties_.fullContentsNoScroll;
    var contentsDiv = noScrollDiv;
    var info = this.properties_.marker.metaInfo_;
    
    // set the title and description
    this.properties_.fullTitleDiv.innerHTML = this.properties_.titleDiv.innerHTML;
    if (typeof info.description == "string") {
        contentsDiv.innerHTML = info.description;
    }
    else {
        contentsDiv.innerHTML = "";
        contentsDiv.appendChild(info.description);
    }
    
    // remove all images except the first one
    var images = contentsDiv.getElementsByTagName("img");
    while (images.length > 1) {
        images[1].parentNode.removeChild(images[1]);
    }

    // resize and reposition first image
    if (images.length > 0) {
        var firstImage = images[0];
        firstImage.onload = function(event) {
            // make sure the image is still in the DOM tree
            var thisImage = event.currentTarget;
            if (!thisImage.parentNode || !thisImage.parentNode.parentNode) {
                return;
            }

            // calculate the max size of the image
            var maxImgWidth = contentsDiv.offsetWidth;
            var maxImgHeight = contentsDiv.offsetHeight;

            // resize the image
            var aspectRatio = thisImage.width / thisImage.height;
            if (thisImage.height > maxImgHeight) {
                thisImage.height = maxImgHeight;
                thisImage.width = maxImgHeight * aspectRatio;
            }
            if (thisImage.width > maxImgWidth) {
                thisImage.width = maxImgWidth;
                thisImage.height = maxImgWidth / aspectRatio;
            }
            // show the image and center it
            var left = (thisImage.parentNode.offsetWidth - thisImage.width) / 2;
            var top = (thisImage.parentNode.offsetHeight - thisImage.height) / 2;
            thisImage.style.left = left + "px";
            thisImage.style.top = top + "px";
            thisImage.style.display = "block";
        }

        // hide it for now
        firstImage.style.display = "none";
        
        // reposition the image
        firstImage.className = "infoFullImageCenter";
        while (contentsDiv.childNodes.length > 0) {
            contentsDiv.removeChild(contentsDiv.firstChild);
        }
        contentsDiv.appendChild(firstImage);
    }

    // fix the links so they open in the browser
    fixLinks(this.properties_.fullTitleDiv);

    // show the full screen div, hide the info window
    noScrollDiv.style.visibility = "visible";
    scrollArea.style.visibility = "hidden";
    var fullVisibility = document.defaultView.getComputedStyle(this.properties_.fullDiv).getPropertyValue("visibility");
    if (fullVisibility == "hidden") {
        this.properties_.fullDiv.style.opacity = 0;
        this.properties_.fullDiv.style.visibility = "visible";
        var animator = new AppleAnimator(this.properties_.fadeDuration, 13, 0, 1, this.updateOpacityFull);
        animator.start();
    }
}

// Show the info window as full screen
InfoWindow.prototype.hideFullScreen = function() {
    // hide the full screen div, show the info window
    var animator = new AppleAnimator(this.properties_.fadeDuration, 13, 1, 0, this.updateOpacityFull);
    var _self = this;
    animator.oncomplete = function() {
        _self.properties_.fullDiv.style.visibility = "hidden";
    }
    animator.start();

}

// Copy this object
InfoWindow.prototype.copy = function() {
    return new InfoWindow(this.properties_.map, this.properties_.div);
}

// Setters and getters

// Indicates if the info window is visible
InfoWindow.prototype.isVisible = function()
{
    return this.properties_.isVisible;
}

// Current center point in pixels relative to map div
InfoWindow.prototype.pixelsPoint = function()
{
    return this.properties_.pixelsPoint;
}

// Determines if a point is inside the window
InfoWindow.prototype.containsPoint = function(point)
{
    var containsPoint = false;
    var div = this.properties_.div;
    if (point.x >= div.offsetLeft && point.y >= div.offsetTop && 
        point.x <= div.offsetLeft + div.offsetWidth && 
        point.y <= div.offsetTop + div.offsetHeight) {
        containsPoint = true;
    }
    
    return containsPoint;
}

// Calculate how much the map has moved since the last re-centering
InfoWindow.prototype.mapDivOffset = function()
{
    var thisMap = this.properties_.map;
    var mapDivOffset = thisMap.fromLatLngToDivPixel(thisMap.getCenter());
    mapDivOffset.x -= Math.round((this.properties_.mapDiv.offsetWidth / 2));
    mapDivOffset.y -= Math.round((this.properties_.mapDiv.offsetHeight / 2));
    return mapDivOffset;
}