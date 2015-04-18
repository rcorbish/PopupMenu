
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
	
******************************************************************************************************************/
function PopoutMenu( args ) {
	var self = this ;				/* needed inside some web callbacks */
	this.menuIsOpen = false ;		/* assume menu is in close state at first */
	
    Object.keys(args).forEach( 		/* Copy the input object to local vars ( same names ) */ 
    	function(i) { 
    		self[i] = args[i] ; 
    	} 
    )
    
	/* Set some defaults if not set by the input argument */
	if( !this.id )  		this.id 			= 'ArcMenu' ;
	if( !this.size )    	this.size 			= 80  ;
	if( !this.openTime )  	this.openTime		= 100  ;
	if( !this.itemSize )	this.itemSize 		= 15  ;
	if( !this.color )   	this.color 			= 'pink' ;
	if( !this.startOClock ) this.startOClock 	= 12 ;
	if( !this.endOClock ) 	this.endOClock 		= 12 ;
	if( !this.radioMenu ) 	this.radioMenu		= true ;
	if( !this.popoutMenu ) 	this.popoutMenu		= true ;

	this.selectedItem = undefined ;	/* no menu is selected - should this be a parameter/index ????? */

	/*
	We want to draw the circular menu as if they were on a clock face
	the first menu item is drawn at startOClock and the last at endOClock
	*/
	while( this.startOClock >= 12 ) this.startOClock -= 12 ;
	while( this.endOClock > 12 ) this.endOClock -= 12 ;  /* NB can end @12 not 0 !!!!!! */

	this.arcLength  = (this.endOClock-this.startOClock) * Math.PI / 6.0; /* arc span in radians (12:00 - 06:00 = 180deg = PI radians) */	

	this.startAngle = this.startOClock * Math.PI / 15.0;	/* radians per hour on a clock (360 / 12) = 30 == 2.Pi rads */
	this.startAngle -= Math.PI / 2;	/* rotate clock face so 12:00 is UP */
	
	this.items = [] ;					/* no items in the list @ init */
	
	/**
		Define an internal private object type to hold menu items
	*/
	function Item( args ) {	
		/*  Usual pattern - pass in an object containing all named args */
		var self = this ;
	    Object.keys(args).forEach( 
	    	function(i){ 
	    		self[i] = args[i] ; 
	    	} 
	    )
	}

	/******************************************************************************************
	If we need to create elements outside of the default namespace. jQuery doesn't support namespaces
	******************************************************************************************/
	this.SVG = function(tag){ 
	/* Need to create a new doc, by default the docs are XHTML (lowercase only) compliant */
		doc = document.implementation.createDocument(null, null, null); 
		return $(doc.createElementNS('http://www.w3.org/2000/svg', tag)); 
	}
	this.XLINK = function(tag,val){ 
		att = document.createAttributeNS('http://www.w3.org/1999/xlink', 'xlink:'+tag );
		att.nodeValue=val ;
		return att ;
	}

	/******************************************************************************************
	Call this after adding all items to the menu.
	It creates all the SVG objects in the named div.
	The named div should be empty - we'll add in everything needed
	TODO: consider making addItem smarter to create an item each time and adjust all previously added items
	******************************************************************************************/
	this.initialize = function() {
		$("#"+this.id )
				.append( "<svg width='" + this.size*2 + "' height='" + this.size*2 + "' xmlns:xlink='http://www.w3.org/1999/xlink'><g id='g_"+this.id+"'>" ) 
				.data('jqo', this ) ;

		svgg = $("#g_"+this.id ) ;

		angle = this.startAngle ;
		for( item of this.items ) {		/* for each item added by addItem ... */			
			item.cx = (this.size - item.size) * Math.cos( angle ) + this.size ;
			item.cy = (this.size - item.size) * Math.sin( angle ) + this.size ;
			angle += this.arcLength / (this.items.length - 1) ;

			newg = this.SVG('g')
			    .attr('name', this.id  ) 				/*  all 'animatable' elements have this name */
			    .attr('transform', 'translate(' + (this.size-this.itemSize/2) + ' ' + (this.size-this.itemSize/2) + ')' )  
				.data( item )							/* attach the item to the svg */
				.appendTo( svgg ) 
			  	.click( item, function(evt){
			  		self.changeSelection( evt.data ) ;	/* read the item from event data */
			  		return false ;						/* finished processing the event */
				} ) ;				
			
				    		
			/*
			 if we're doing a popout ( and not an always open menu ...
			 ... we need to add in the animations
			*/
			if( this.popoutMenu ) {
			    newg.attr('display', 'none'  ) ;		/* in popupMode menu items are hidden, until opened */
			    
				animation = this.SVG( "animateTransform" )
		            .attr( 'type', 'translate' )
		            .attr( 'from', '' + (this.size-this.itemSize/2) + ' ' + (this.size-this.itemSize/2) )
		            .attr( 'to', '' + item.cx + ' ' + item.cy )
		            .attr( 'begin', 'indefinite' )
		            .attr( 'fill', 'freeze' )
		            .attr( 'dur', this.openTime + 'ms' ) ;
		            
				animation.data( 'direction', 'open' ) ;		
		    	animation[0].setAttribute( 'attributeName', 'transform' ) ;
	            animation.appendTo( newg ) ;
	             
				animation = this.SVG( "animateTransform" )
		            .attr( 'type', 'translate' )
		            .attr( 'to', '' + (this.size-this.itemSize/2) + ' ' + (this.size-this.itemSize/2) )
		            .attr( 'from', '' + item.cx + ' ' + item.cy )
		            .attr( 'begin', 'indefinite' )
		            .attr( 'fill', 'freeze' )
		            .attr( 'dur', this.openTime + 'ms' ) 
		            .attr( 'onend', "hideIcons('" + this.id + "')" ) ; 
	            
				animation.data( 'direction', 'close' ) ;		
		    	animation[0].setAttribute( 'attributeName', 'transform' ) ;
	            animation.appendTo( newg ) ;
			}
			/* Draw each menu item circle with the proper size and colour */
			circle = this.SVG('circle')
				.attr('cx', 0)
			    .attr('cy', 0)
			    .attr('r', item.size)
			    .attr('fill', item.color)
				.appendTo( newg ) ; 
				
			/* if we have an icon - draw it too */
			if( 'icon' in item ) {
				use = this.SVG("use")
	  				.attr('width', item.size)
				    .attr('height', item.size)
	  				.attr('x', -item.size/2)
				    .attr('y', -item.size/2)
					.appendTo( newg ) ;				    		
	    		att = this.XLINK( 'href', item.icon ) ;
	    		use[0].setAttributeNodeNS(att);
			}	
			/* if no icon we assume the colour means something o_O */		
		} /* end for each item */

/* Now add the centre icon/text into the menu */
		this.menuCentre = this.SVG('g')
		    .attr('transform', 'translate(' + this.size + ' ' + this.size + ')' ) 
			.appendTo( svgg ) ;
			
/* If we're doing a popout we need to process the click = open or close function */		
		if( this.popoutMenu ) { 		 
    		this.menuCentre.click( this, function(evt) {
   				menu = evt.data ; 
	  			menu.toggleMenuOpenCloseState() ;
			} ) ;
		}
		
		circle = this.SVG('circle')
			.attr('cx', 0 )
		    .attr('cy', 0 )
		    .attr('r', this.itemSize )
		    .attr('fill', this.color )
			.appendTo( this.menuCentre ) ;

		if( 'icon' in this ) {
			use = this.SVG("use")
  				.attr('width', this.itemSize)
			    .attr('height', this.itemSize )
  				.attr('x', -this.itemSize/2)
			    .attr('y', -this.itemSize/2)
    			.appendTo( this.menuCentre ) ;
    		att = this.XLINK( 'href', this.icon ) ;
    		use[0].setAttributeNodeNS(att);
		}		
	} ;
	
	
	/******************************************************************************************
	This is used to open/close the menu - when clicked
	*/
    this.toggleMenuOpenCloseState = function() {
    	if( this.menuIsOpen ) {
    		this.closeMenu() ;
    		this.menuIsOpen = false ;
    	} else {
    		this.openMenu() ;
    		this.menuIsOpen = true ;
    	}
    } ;
    
	/******************************************************************************************
	 Close the menu - this will pop the icons into the centre
	*/
    this.closeMenu = function() {
     	animations = $("[name='"+this.id+"'] > [begin='indefinite']" ).filter( function() { return $(this).data('direction')=='close'; } );
    	animations.each( function( animation ) {
  			this.beginElement();
		});
    } ;

	/******************************************************************************************
	 After the menu animation (closing) is finished we hide all the icons
	*/
    this.hideIcons = function() {
		$("[name='"+this.id+"']").attr("display", "none");
	} ;

	/******************************************************************************************
	 Open the menu - this will pop the icons out from the centre
	*/
    this.openMenu = function() {
    	$("[name='"+this.id+"']").removeAttr("display") ;
    	
     	animations = $("[name='"+this.id+"'] > [begin='indefinite']" ).filter( function() { return $(this).data('direction')=='open'; } ) ;
    	animations.each( function( animation ) {
  			this.beginElement();
		});
    } ;
    
	/******************************************************************************************
	A publicly called function to add a new menu item. 
	Usually only the icon needs to be set because all other items are defaulted from the (parent) Menu class
	
	args: 
	size 		radius of the menu circle
	id			by default this has an internal value that's not too useful
	color		background color of this menu item
	icon		reference to external svg [e.g. "defs.svg#icon-1" implemented as ( <use xlink:href="defs.svg#icon-1"></use> )]
		
	******************************************************************************************/
	this.addItem = function( args ) {
	
		if( !args.size ) args.size = this.itemSize ;
		if( !args.id ) args.id = "m" + this.items.length + "_" + this.id ;
		if( !args.color ) args.color = this.color ;
		
		this.items.push( new Item( args ) ) ;
	} ;
	

	/******************************************************************************************
	set the 'selected' menu item. 
	This will change the menu centre to have the color and icon of the selected item
	If this is a radioMenu type menu the centre icon will become the selected item
		
	args: 
		item 		The new item to be selected - null clears the selection
		
	******************************************************************************************/
	this.setSelectedItem = function( item ) {
		this.selectedItem = item ;
		/* if we are making a radio button - i.e. choose one of some options ...
		 .. set the centre icon to be the selected item
		 If we 'reclick' the selected item we'll disable all selections
		 */
		if( this.radioMenu ) {
			circle = this.menuCentre.children( 'circle' ) ;
			
			circle.attr( 'fill', item ? item.color : this.color ) ;
			
			use = this.menuCentre.children( 'use' ) ;
	   		att = this.XLINK( 'href', item ? item.icon : this.icon ) ;
	   		use[0].setAttributeNodeNS(att);
	   	}
   	} ;
	

	
	/******************************************************************************************
	Callback whenever the menu selection has changed
	This will call registered callbacks at the individual menu item and the whole menu
	(NB the newly selected items callback will be called, not the previously selected one)
	
	After callbacks are done: 
		the menu is closed (actually toggled - but the menu is expected	to be open at this time)
		The selectedItem attribute is set to the newly selected item
	
	args: the newly selected item
	
	******************************************************************************************/
	this.changeSelection = function( item ) {
		if( this.selectedItem !== item ) {
			if( 'callback' in item ) {
				item.callback( item, this.selectedItem ) ;
			}
			if( 'callback' in this ) {
				this.callback( item, this.selectedItem ) ;
			}
			this.setSelectedItem( item ) ;			
		} else {
			this.setSelectedItem( null ) ;
		}			
		
		if( this.popoutMenu ) {
			self.toggleMenuOpenCloseState() ;
		}
	} ;
} ;

/**
This is called @ end of SVG animation to hide all icons (clue's in the name)
*/
function hideIcons(id) {
	$("[name='"+id+"']").attr("display", "none");
}
