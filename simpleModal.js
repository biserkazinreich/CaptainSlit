function openModal(id){
	console.log(id, "here");
	let $element = $("#" + id);
	$element.addClass('active');
	$element.append('<div class="modal-close" onClick="closeModal()"></div>');   
}

function closeModal(id){
	let $element = $("#" + id);
	$element.removeClass('active');
	$element.find(".modal-close").remove();
}