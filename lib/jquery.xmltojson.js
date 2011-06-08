/**
 * @fileoverview jQuery library to transform XML into JSON
 * @version 0.1
 * @author Sebastian Kranz
 * requires jQuery
 */

/**
 * Class XMLtoJSON
 * @param {object} options
 * url: URL to receive XML
 * xmlString: Alternate XML as string
 * namespaces: Boolean flag to include or exclude namespaces for each JSON element
 * valueIdentifier: String to access the node text value
 * attributeIdentifier: Starting char to access a specific attribute name
 * emptyValuesAsNull: Save empty attribute oder node values as null
 * modify: Hash to modify the json result set
 *   E.g. move node 'a' from 'root.children' to 'root' and rename it as 'b': { 'root.children.a' : 'root.b' })
 *   Each entry will be sequentially proceeded, so please beware of the given order
 * clearEmptyNodes: Clear empty parent node after a JSON tree modification (attributes will be ignored)
 * cache: Cache downloaded XML file
 * detectTypes: Convert true, false, integer or null values
 * filter: Add miscellaneous filter function to parse the XML attribute/node values (e.g. filter: function(value){return value + '!'})
 * fallback: Function which is thrown if the XML is invalid or could not requested
 * log: Enable or disable output on console for errors and converting problems
 */

var XMLtoJSON = function(options){
	
	// Define Initialization
	this.init = function(){
		
		this.xml = false,
		this.document = false;
		this.json = {};
		this.duration = new Date();
		
		// Merge options with defaults
		this.options = $.extend({
			url: false,
			xmlString: false,
			namespaces: false,
			valueIdentifier: '$',
			attributeIdentifier: '_',
			emptyValuesAsNull: false,
			modify: {},
			clearEmptyNodes: false,
			cache: false,
			detectTypes: false,
			filter: null,
			fallback: null,
			log: false
		}, options);
		
		// Get XML as string
		if(this.options.url) this.receiveXML();
		if(this.options.xmlString) this.xml = this.options.xmlString;
		
		if(this.xml){
		
			// Build XML DOM
			this.parseXML();
			
			// Get JSON
			this.convertXML();
			
			// Throw fallback method if JSON is empty or invalid
			if(this.options.fallback != null && (this.json == {} || this.json.parsererror)) this.options.fallback({message : 'XML is invalid', code : 500});
		
			// Modify JSON
			this.modifyJSON();
		}
	
		// Time taken
		this.duration = new Date() - this.duration + ' ms';
	}
	
	// Get XML as text from a external url
	this.receiveXML = function(){
		var url = this.options.url,
				response;
		$.ajax({
			type: 'GET',
			url: url,
			async: false,
			dataType: 'text',
			cache: this.options.cache,
			complete: function(data){
				if(data.responseText) response = data.responseText.replace(/^\s+/, '');
			}
		});
		if(response){
			this.xml = response;
		}
		else{
			this.throwError('Cannot receive XML from ' + this.options.url);
			if(this.options.fallback != null) this.options.fallback({message : 'Cannot receive XML from ' + this.options.url, code : 404});
		}
	}
	
	// Parse XML
	this.parseXML = function(){
		this.xml = this.xml.replace(/^[\s\n\r\t]*[<][\?][xml][^<^>]*[\?][>]/, '');
		if(window.ActiveXObject){
			this.document = new ActiveXObject('Microsoft.XMLDOM');
			this.document.async = false;
			this.document.loadXML(this.xml);
		}
		else{
			this.document = new DOMParser();
			this.document = this.document.parseFromString(this.xml, 'application/xml');
		}
		if(!this.xml || !this.document) this.throwError('Cannot parse XML');
	}
	
	// Convert XML to JSON (inner closure, recursive)
	// Increase performance by replace jQuery.each with native Javascript for-loop (should be 2-3 times faster, depeding von the Document size)
	this.convertXML = function(){
		var _this = this;
		(function evaluate(node, obj, options, ns) {
			
			// Node value valueIdentifier
			var valueIdentifier = options.valueIdentifier,
					attributeIdentifier = options.attributeIdentifier;
			
			// Document node
			if(node.nodeType === 9){
				$.each(node.childNodes, function(){
					evaluate(this, obj, options, ns);
				});
			}
		
			// Element node
			else if (node.nodeType === 1){
			
				// Set active namespace to {valueIdentifier : true} if ns.$ is set
				var activeNamespace = ns[valueIdentifier] ? { valueIdentifier : true } : {};
				// Current node name
				var nodeName = node.nodeName;
				// Add namespaces
				var addNamespaces = options.namespaces == true ? true : false;
				// Current
				var current = {};
				// Namespace
				if (nodeName.indexOf(':') != -1) activeNamespace[nodeName.substr(0, nodeName.indexOf(':'))] = true;
				
				// Attributes
				$.each(node.attributes, function(){
					var name = this.nodeName;
					var value = this.nodeValue;
					if(_this.options.filter) value = _this.options.filter(value);
					if(_this.options.detectTypes) value = _this.detectTypes(value);
					
					if(name === 'xmlns'){ // general namespace
						ns[valueIdentifier] = value;
						activeNamespace[valueIdentifier] = true;
					}
					else if(name.indexOf('xmlns:') === 0){ // specific regular namespace
						ns[name.substr(name.indexOf(':') + 1)] = value;
					}
					else if(name.indexOf(':') != -1){  // some other namespace type - may throw a parsererror before 
						current[attributeIdentifier + name] = value;
						activeNamespace[name.substr(0, name.indexOf(':'))] = true;
					}
					else{ // regular attribute
						if(_this.options.emptyValuesAsNull && (value === '' || value === null)){
							current[attributeIdentifier + name] = null;
						}
						else{
							current[attributeIdentifier + name] = value; 
						}
					}
				});
				
				// Add namespaces
				var namespace = addNamespaces ? ns : activeNamespace;
				$.each(namespace, function(key, value){
					if(namespace.hasOwnProperty(key)){
						current[attributeIdentifier + 'xmlns'] = current[attributeIdentifier + 'xmlns'] || {};
						current[attributeIdentifier + 'xmlns'][key] = value;
					}
				});
				
				// Add
				if(obj[nodeName] instanceof Array){
					obj[nodeName].push(current);
				}
				else if(obj[nodeName] instanceof Object){
					obj[nodeName] = [obj[nodeName], current];
				}
				else{
					obj[nodeName] = current;
				}
				if(_this.options.emptyValuesAsNull && node.childNodes.length == 0){
					obj[nodeName] = null;
				}
				
				// Recursion
				$.each(node.childNodes, function(){
					evaluate(this, current, options, ns);
				});
			}
		
			// Text node
			else if(node.nodeType === 3){
				var value = node.nodeValue;
				if(!value.match(/[\S]+/)) return; // Whitespace
				if(_this.options.filter) value = _this.options.filter(value);
				if(_this.options.detectTypes) value = _this.detectTypes(value);
				// Add
				if(obj[valueIdentifier] instanceof Array){
					obj[valueIdentifier].push(value);
				}
				else if(obj[valueIdentifier] instanceof Object){
					obj[valueIdentifier] = [obj[valueIdentifier], value];
				}
				else{
					obj[valueIdentifier] = value;
				}
			}

		})(this.document, this.json, this.options, {}); // Execute
	}
	
	// Modify JSON
	this.modifyJSON = function(){
		var _this = this,
				attributeIdentifier = this.options.attributeIdentifier;
		$.each(this.options.modify, function(url, modified){
			// var content = _this.get(url);
			// TODO _this.remove(url) does not work for Array elements which are selected by find without array brackets
			var all = url.match(/\.\*$/) ? true : false;
			var url = all ? url.replace(/\.\*$/, '') : url;
			var content = _this.find(url);
			if(content){
				var newParent = modified.replace(/\.[^\.]*$/,'');
				if(modified.split('.').length > 1){
					var newNode = newParent + '["' + modified.split('.')[modified.split('.').length-1] + '"]';
				}
				else{
					var newNode = modified;
				}
				if(!all) _this.remove(url);
				if(newParent.split('.').length > 1) _this.createNodes(newParent);
				_this.createNodes(modified);
				if(all){
					newNode = newNode.match(/\[\"\"\]/) ? '' : (newNode + '.');
					$.each(content, function(key, value){
						if(key[0] != attributeIdentifier) eval('_this.json.' + newNode + key + ' = value');
					});
					$.each(_this.find(url), function(key, value){
						if(key[0] != attributeIdentifier) _this.remove(url + '.' + key);
					});
				}
				else{
					eval('_this.json.' + newNode + ' = content');
				}
				if(_this.options.clearEmptyNodes){
					var parentNode = all ?  _this.find(url) : _this.find(url.replace(/\.[^\.]*$/, ''));
					var emptyNodes = true;
					$.each(parentNode, function(key, value){
						if(value instanceof Object){
							var children = 0;
							for (var i in value) children++;
							if(children > 1 || children == 1 && !_this.options.namespaces) return emptyNodes = false;
						}
						if(key[0] != attributeIdentifier) return emptyNodes = false;
					});
					if(emptyNodes){
						all ? _this.remove(url) : _this.remove(url.replace(/\.[^\.]*$/,''));
					}
				}
			}
		});
	}
	
	// Create a all parts of a non existing node tree
	this.createNodes = function(string){
		var _this = this;
		var node = this.get(string, false);
		if(node) return;
		(function checkNode(url, index){
			var current = url.split('.')[index];
			if(!current) return;
			var partUrl = [];
			for(var i=0; i<=index; i++){
				partUrl.push(url.split('.')[i]);
			}
			partUrl = partUrl.join('.');
			var part = _this.get(partUrl, false);
			if(!part) eval('_this.json.' + partUrl + '={}');
			checkNode(url, index+1);
		})(string, 0);
	}
	
	// Get JSON by a full identifiable String splitted by '.'
	this.get = function(path, log){
		var array = '',
			root = null,
			log = (log == false) ? false : true;
			path = path.replace(/^\./, '');
		$.each(path.split('.'), function(){
			if(this.match(/\[*.\]$/)){
				array += '["' + this.split('[')[0] + '"]' + this.match(/\[*.\]$/)[0];
			}
			else{
				array += '["' + this + '"]';
			}
		});
		try{
			root = eval('this.json' + array);
		}
		catch(e){
			if(log == true) this.throwError('Invalid path ' + path);
		}
		return (root) ? root : (log == true ? this.throwError('Could not access ' + path) : null);
	}
	
	// Find each JSON element by a given String splitted by '.' and additional conditions
	this.find = function(path, condition){
		var _this = this,
			parts = [];
		// Get children from path
		function children(root, path){
			var url = '',
				parts = [];
			$.each(path.split('.'), function(i){
				var tempParts = [];
				if(i == 0){
					url = this;
					tempParts = root;
				}
				else{
					url += '.' + this;
					if(this.match(/\[*.\]$/)){
						tempParts = parts[this.split('[')[0]][this.match(/\[*.\]$/)[0].replace(/[\[|\]]/g,'')];
					}
					else if(parts instanceof Array){
						var part = this;
						$.each(parts, function(){
							if(this instanceof Array){
								$.each(this, function(){
									if(this[part] != undefined) tempParts.push(this[part]);
								});
							}
							else{
								if(this[part] != undefined) tempParts.push(this[part]);
							}
						});
					}
					else{
						tempParts = parts[this];
					}
				}
				if(!tempParts || tempParts.length == 0){
					_this.throwError('Invalid path ' + url);
					parts = [];
					return false;
				}
				else{
					parts = tempParts;
				}
			});
			return parts;
		}
		// Get object
		if(path.split('.')[0].match(/\[*.\]$/)){
			var index = path.split('.')[0].match(/\[*.\]$/)[0].replace(/[\[|\]]/g, '');
			var root = this.json[path.split('.')[0].replace(/\[.*\]/, '')][index];
		}
		else{
			var root = this.json[path.split('.')[0]];
		}
		parts = children(root, path);
		if(condition){
			// Define match function for condition
			function match(element, operator, rule){
				if(element && operator && rule){
					if(operator === '=~'){
						var options = '';
						if(rule.match(/^\/.*/) && rule.match(/\/.$/)){
							options = rule[rule.length - 1];
							rule = rule.substring(0, rule.length - 1);
						}
						rule = rule.replace(/^\//, '').replace(/\/$/, '');
						return (element.toString().match(new RegExp(rule, options))) ? true : false;
					}
					else{
						if(operator === '==' || operator === '!='){
							return (eval('element.toString()' + operator + 'rule')) ? true : false;
						}
						else{
							rule = parseInt(rule);
							element = parseInt(element);
							return (eval('element' + operator + 'rule')) ? true : false;
						}
					}
				}
			}
			var validParts = [],
				rule = condition.replace(/^.*(==|\>=|\<=|\>|\<|!=|=~)/, ''),
				subpath = condition.replace(/(==|\>=|\<=|\>|\<|!=|=~).*$/, '').replace(/\s$/, ''),
				operator = condition.replace(rule, '').replace(subpath, '').replace(/\s/, ''),
				element = subpath.split('.')[subpath.split('.').length-1];
			if(element === subpath) subpath = null;
			if(parts instanceof Array){
				if(!subpath){
					$.each(parts, function(){
						if(match(this[element], operator, rule)) validParts.push(this);
					});
				}
				else{          
					$.each(parts, function(){
						var currentChildren = children(this, '.' + subpath),
							part = this;
						if(currentChildren instanceof Array){
							$.each(currentChildren, function(){
								if(match(this, operator, rule)){
									validParts.push(part);
									return false;
								}
							});
						}
						else{
							if(match(currentChildren, operator, rule)){
								validParts.push(this);
							}
						}
					});
				}
				parts = validParts;
			}
			else{
				if(!subpath){
					if(!match(parts[element], operator, rule)){
						parts = null;
					}
				}
				else{
					var currentChildren = children(parts, '.' + subpath);
					var currentChildren = children(parts, '.' + subpath),
						valid = false;
					if(currentChildren instanceof Array){
						$.each(currentChildren, function(){
							if(match(this, operator, rule)){
								valid = true;
								return false;
							}
						});
					}
					else{
						if(match(currentChildren, operator, rule)) valid = true;
					}
					parts = valid ? parts : null;
				}
			}
		}
		return (!parts) ? [] : parts;
	}
	
	// Remove JSON by a given String splitted by '.'
	this.remove = function(string){
		if(this.get(string)){
			eval('delete this.json.' + string);
			if(string.match(/\[*.\]$/)){
				var _this = this;
				//var filterNull = obj.filter(undefined);
				var filterNull = $.grep(eval('_this.json.' + string.replace(/\[*.\]$/, '')), function(n,i){
					return(n);
				});
				eval('_this.json.' + string.replace(/\[*.\]$/, '') + ' = filterNull');
			}
		}
	}
	
	// Detect type for string values of true, false, integer and null 
	this.detectTypes = function(string){
		if(string.match(/^true$/i)){
			return true
		}
		else if(string.match(/^false$/i)){
			return false;
		}
		else if(string.match(/^null|NaN|nil|undefined$/i)){
			return null;
		}
		else if(string.match(/^[0-9]*$/i)){
			return parseInt(string);
		}
		else{
			return string;
		}
	}
	
	// Log specific error message
	this.throwError = function(msg){
		if(this.options.log){
			if(!window.console){
				// Add log method to window.console
				window.console = {
					log : function(s){ alert(s); }
    		};
  		}
			console.log(msg);
	  }
	}
	
	// Initialize
	this.init();

};