async function fetch()
{	
	const fetch = require("node-fetch");

	let data = await fetch("https://showcase.linx.twenty57.net:8081/UnixTime/tounixtimestamp?datetime=now");

	data = await data.json();

	console.log(data.UnixTimeStamp)
}

fetch()
