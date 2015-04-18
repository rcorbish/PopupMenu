# PopupMenu
An HTML5/SVG popup menu, which appears as a circle of menu items

/*****************************************************************************************************************

  	PopoutMenu
  	
	Create a new choice menu (aka RadioButton) using the following arguments:
	
	id 			name of a div in which to draw the menu. Default "ArcMenu"
	size 		radius of the memu when opened
	itemSize	radius of each menu circle
	color		background color of the menu items
	startOClock	the clock number at which to start drawing the menu
	endOClock	the clock number at which to draw the last menu item
	callback	function( newItem, oldItem) called whenever the menu selection changes. No default
	popoutMenu	a boolean - false means the menu is always open, true - the menu expands/collapses when clicked. Default true
	radioMenu	a boolean - true sets the menu to change the centre icon to the selected item. Default true
	
	Menu items are drawn clockwise.
	Individual menuItems size, color, etc. can be overridden (see addItem)
	
	example usage. A 3/4 circle of 6 menuItems, the centre circle is pink the outer circles are larger grey circles
	
	menu = new PopoutMenu( { id: "theMenu", endOClock: 9, itemSize: 20 } ) ;
	for( var i=0 ; i<6 ; i++ ) {
		menu.addItem( { color: 'silver', size:20 } ) ;
	}
	menu.initialize() ; 
	
	
	
	Minified by http://www.jsmini.com/
******************************************************************************************************************/

