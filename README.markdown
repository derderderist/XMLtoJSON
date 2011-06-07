# XMLtoJSON - jQuery library to convert XML into JSON

## What is XMLtoJSON

This library converts XML into a customizable data object. The data object contains the transformed JSON and some additional methods.


## Requirements

XMLtoJSON requires:

* jQuery (> 1.5)
* John's Resig Simple-Inheritance


## Usage

	var data = new XMLtoJSON({
		url: 'path/file.xml'
	});


## Available parameters

	url // URL to request a XML file
	xmlString // Additional XML string for direct input
	namespaces // Add detailed namespace information to each JSON element
	valueIdentifier // Symbol to access the node text value
	attributeIdentifier // Prefix for alle node attributes
	emptyValuesAsNull // Set empty attribute or node values to null
	modify // Hash to transform the JSON object
	clearEmptyNodes // Clear a parent node if all child nodes where moved
	cache // Cache the downloaded XML file
	detectTypes // Automatically parse true, false, integer and null values
	filter // Define a function to customize each XML attribute or text value
	fallback // Define a function if XML is invalid or could not requested
	log // Enable or disable output on console for errors and converting problems

See examples/index.html to get a full overview of all parameters in usage


## Attributes

	data.xml // Return the given XML
	data.document // Return the given XML als DOM object
	data.json // Return the XML as transformed JSON object
	data.duration // Return the elapsed time for the complete process
	data.options // Return the given parameters


## JSON accessors

The XML is fully converted in a JSON object and accessed by default object connection.

	data.json.rootnode // Return object <rootnode>
	data.json.rootnode.subnode // Return object <subnode> in <rootnode>
	data.json.rootnode.subnode[0] // Return first <subnode> in <rootnode>
	data.json.rootnode._version // Return attribute 'version' for <rootnode>
	data.json.rootnode.subnode[0].$ // Return text value of first <subnode> in <rootnode>
	data.json.rootnode._xmlns // Return detailed namespace information for <rootnode> (option 'namespaces' must be set to true)


## Methods

You can use a string notation (like 'rootnode.subnode') to do something with the JSON content.

	data.createNodes(<String> path) // create a full JSON tree by the given path
	data.remove(<String> path) // remove the given path from the JSON object
	data.find(<String> path, [<String> conditions]) // Method to get a specific part of the JSON object. See examples/index.html to get further information.


## Browser compatibility

XMLtoJSON was successfully tested in:

* Internet Explorer 6/7/8/9 (Windows)
* Firefox 4.0.1 (Windows)
* Google Chrome 10.0.648.204 (Windows)
* Safari 5.0.5 (Windows)
* Opera 11.10 (Windows)

Note: Chrome and Opera do not allow access via a Ajax-Request to a file from locale storage. Run the demo from a webserver or configure your browser (e.g. --allow-file-access-from-files for Chrome)

## ToDo

* Improve entity parsing
* Additional speed optimization
* Make it possible to convert Arrays into Hashes with specified keys
* Improve get und remove method
* Move content from multiple nodes (Array) into a new placeholder and merge it