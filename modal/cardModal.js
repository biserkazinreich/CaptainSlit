function openModal(id, generateClose){
	let $element = $("#" + id);
	$element.addClass('active');

	if(generateClose)
		$element.append('<div class="modal-close" onClick="closeModal(\'' + id + '\')"></div>');
}

function closeModal(id){
	let $element = $("#" + id);
	$element.removeClass('active');
	$element.find(".modal-close").remove();
}