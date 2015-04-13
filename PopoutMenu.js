

/*****************************************************************************************************************

  	PopoutMenu
  	
	Create a new choice menu (aka RadioButton) using the following arguments:
	
	id 			name of a div in which to draw the menu. Default "ArcMenu"
	size 		radius of the memu when opened
	itemSize	radius of each menu circle
	color		background color of the menu items
	startOClock	the clock number at which to start drawing the menu
	endOClock	the clock number at which to draw the last menu item
	callback	function( newItem, oldItem) called whenever the menu selection changes
	
	Menu items are drawn clockwise.
	Individual menuItems size, color, etc. can be overridden (see addItem)
	
	example usage. A 3/4 circle of 6 menuItems, the centre circle is pink the outer circles are larger grey circles
	
	menu = new PopoutMenu( { id: "theMenu", endOClock: 9, itemSize: 20, callback: cbf } ) ;
	for( var i=0 ; i<6 ; i++ ) {
		menu.addItem( { color: 'silver', size:20 } ) ;
	}
	menu.initialize() ; 
	
******************************************************************************************************************/

function hideIcons(id) {
	$("[name='"+id+"']").attr("display", "none");
}

function PopoutMenu( args ) {
	var self = this ;
	
    Object.keys(args).forEach( 
    	function(i){ 
    		self[i] = args[i] ; 
    	} 
    )
    
	// Set some defaults is necessary
	if( !this.id )  		this.id 			= 'ArcMenu' ;
	if( !this.size )    	this.size 			= 80  ;
	if( !this.openTime )  	this.openTime		= 100  ;
	if( !this.itemSize )	this.itemSize 		= 15  ;
	if( !this.color )   	this.color 			= 'pink' ;
	if( !this.startOClock ) this.startOClock 	= 12 ;
	if( !this.endOClock ) 	this.endOClock 		= 12 ;

	this.selectedItem = undefined ;

	/*
	We want to draw the circular menu as if they were on a clock face
	the first menu item is drawn at startOClock and the last at endOClock
	*/
	while( this.startOClock >= 12 ) this.startOClock -= 12 ;
	while( this.endOClock > 12 ) this.endOClock -= 12 ;  // NB can end @12 not 0 !!!!!!

	this.arcLength  = (this.endOClock-this.startOClock) * Math.PI / 6.0; // arc span 12 hours = 360deg = 2.Pi rads	

	this.startAngle = this.startOClock * Math.PI / 15.0;	// radians per hour on a clock (360 / 12) = 30 == 2.Pi rads
	this.startAngle -= Math.PI / 2;	// convert to 12 o'clock = UP not 3:00 as in polar-coords
	
	this.items = [] ;
	
	function Item( args ) {
		var self = this ;
	    Object.keys(args).forEach( 
	    	function(i){ 
	    		self[i] = args[i] ; 
	    	} 
	    )
	}

	/******************************************************************************************
	Create elements outside of the default namespace. jQuery doesn't support namespaces
	******************************************************************************************/
	this.SVG = function(tag){ 
	// Need to create a new doc, by default the docs are XHTML (lowercase only) compliant
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
	TODO: consider making addItem smarter to create an item each time and adjust all previously added items
	******************************************************************************************/
	this.initialize = function() {
		$("#"+this.id )
				.append( "<svg width='" + this.size*2 + "' height='" + this.size*2 + "' xmlns:xlink='http://www.w3.org/1999/xlink'><g id='g_"+this.id+"'>" ) 
				.data('jqo', this ) ;

		svgg = $("#g_"+this.id ) ;

		angle = this.startAngle ;
		for( item of this.items ) {
			
			item.cx = (this.size - item.size) * Math.cos( angle ) + this.size ;
			item.cy = (this.size - item.size) * Math.sin( angle ) + this.size ;
			angle += this.arcLength / (this.items.length - 1) ;

			newg = this.SVG('g')
			    .attr('name', this.id  ) 				// all 'animatable' elements have this name
			    .attr('display', 'none'  ) 				// by default it's hidden
			    .attr('transform', 'translate(' + (this.size-this.itemSize/2) + ' ' + (this.size-this.itemSize/2) + ')' ) 
				.data( item )							// attach the item to the svg
				.appendTo( svgg ) 
			  	.click( item, function(evt){
			  		self.changeSelection( evt.data ) ;	// read the item from event data
			  		return false ;						// finished processing the event
				} ) ;				    		
			
			animation = this.SVG( "animateTransform" )
	            .attr( 'type', 'translate' )
	            .attr( 'from', '' + (this.size-this.itemSize/2) + ' ' + (this.size-this.itemSize/2) )
	            .attr( 'to', '' + item.cx + ' ' + item.cy )
	            .attr( 'begin', 'indefinite' )
	            .attr( 'fill', 'freeze' )
	            .attr( 'dur', this.openTime + 'ms' ) ;
	            
			animation.data( 'direction', 'open' ) ;		
	    	animation[0].setAttribute( 'attributeName', 'transform' ) ;
            animation.appendTo( newg )
             
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
            animation.appendTo( newg ) 
			
			circle = this.SVG('circle')
				.attr('cx', 0)
			    .attr('cy', 0)
			    .attr('r', item.size)
			    .attr('fill', item.color)
				.appendTo( newg ) ; 

			if( 'icon' in item ) {
				use = this.SVG("use")
	  				.attr('width', item.size)
				    .attr('height', item.size)
	  				.attr('x', -item.size/2)
				    .attr('y', -item.size/2)
					.appendTo( newg ) ;				    		
	    		att = this.XLINK( 'href', item.icon ) ;
	    		use[0].setAttributeNodeNS(att);
			} else {
				txt = this.SVG("text")
				    .append( item.label )
	  				.attr('x', -item.size/2 )
				    .attr('y', -item.size/2 )
					.appendTo( newg ) ;				    		
			}			
		}
		
		this.SVG('circle')
			.attr('cx', this.size )
		    .attr('cy', this.size )
		    .attr('r', this.itemSize )
		    .attr('fill', this.color )
			.appendTo( svgg )
			.click( this, function(evt) {
   				menu = evt.data ; 
	  			menu.toggleMenuOpenCloseState() ;
				} ) ;

		if( 'icon' in this ) {
			use = this.SVG("use")
  				.attr('width', this.itemSize)
			    .attr('height', this.itemSize )
  				.attr('x', this.size-this.itemSize/2)
			    .attr('y', this.size-this.itemSize/2)
    			.appendTo( svgg )
    			.click( this, function(evt) {
   					menu = evt.data ; 
	  				menu.toggleMenuOpenCloseState() ;
				} ) ;
    			
    		att = this.XLINK( 'href', this.icon ) ;
    		use[0].setAttributeNodeNS(att);
    			    		
		} else {
			this.SVG("text")
			    .append( "open" )
  				.attr('x', this.size-this.itemSize/2)
			    .attr('y', this.size-this.itemSize/2)
    			.appendTo( svgg )
    			.click( this, function(evt) {
   					menu = evt.data ; 
	  				menu.toggleMenuOpenCloseState() ;
				} ) ;
		}		
	}
	
	this.menuIsOpen = false ;
	
    this.toggleMenuOpenCloseState = function() {
    	if( this.menuIsOpen ) {
    		this.closeMenu() ;
    		this.menuIsOpen = false ;
    	} else {
    		this.openMenu() ;
    		this.menuIsOpen = true ;
    	}
    }
    
    this.closeMenu = function() {
     	animations = $("[name='"+this.id+"'] > [begin='indefinite']" ).filter( function() { return $(this).data('direction')=='close'; } )
    	animations.each( function( animation ) {
  			this.beginElement();
		});
		
    	// $("[name='"+this.id+"']").attr("display", "none");
    }

    this.hideIcons = function() {
		$("[name='"+this.id+"']").attr("display", "none");
	}

    this.openMenu = function() {
    	$("[name='"+this.id+"']").removeAttr("display") ;
    	
     	animations = $("[name='"+this.id+"'] > [begin='indefinite']" ).filter( function() { return $(this).data('direction')=='open'; } )
    	animations.each( function( animation ) {
  			this.beginElement();
		});
    }
    
	/******************************************************************************************
	A publicly called function to add a new menu item. 
	Usually only the label needs to be set because all other items are defaulted from the (parent) Menu class
	
	args: 
	size 		radius of the menu circle
	id			by default this has an internal value that's not too useful
	color		background color of this menu item
	label		Name of the text in the menu item
	icon		reference to external svg [e.g. "defs.svg#icon-1" implemented as ( <use xlink:href="defs.svg#icon-1"></use> )]
		
	******************************************************************************************/
	this.addItem = function( args ) {
	
		if( !args.size ) args.size = this.itemSize ;
		if( !args.id ) args.id = "m" + this.items.length + "_" + this.id ;
		if( !args.color ) args.color = this.color ;
		if( !args.label && !args.icon ) args.label = "M " + this.items.length ;
		
		this.items.push( new Item( args ) ) ;
	}
	
	
	
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
			this.selectedItem = item ;
			self.toggleMenuOpenCloseState() ;
		}
	}
}
