let otherInv = false;
let closeKey = null;

function debug_Fullscreen() {
	if (debug)
		document.body.requestFullscreen()
}

$(() => {
	window.addEventListener('message', (e) => {
		let data = e.data;
		if (data.action == 'open') {
			closeKey = data.closeKey;
			$('body').fadeIn(200);
			$('#other').hide();

			if (data.otherInventory) {
				$('#other').fadeIn(200);
				otherInv = true;

			} else {
				$('#other').hide();
				otherInv = false;
			}

			$('#players').html('');
			$.each(data.players, (index, player) => {
				$('#players').append(`<option value="${player.player}">${player.name}</option>`)
			});
		} else if (data.action == 'close') {
			closeInventory()
		} else if (data.action == 'setInventory') {
			if (data.weight) {
				let current_weight = data.weight.current.toFixed(1)
				let max_weight = data.weight.max.toFixed(1)
				$('#player').find('.inv-weight').html(`Poids<hr/><div class="weight"><span class="cur-weight">${current_weight}<span style="color: whitesmoke">KG</span></span><span class="max-weight">/ ${max_weight}KG</span></div>
				<div class="weight-jauge"
				style="width:${max_weight * 100 / max_weight }%">
				<div class="cur-jauge "
				style="width:${current_weight * 100 / max_weight }%" >
				</div</div>`)
			}
			setupgunbar(data.gunbar)
			setupInventory($('#player'), 'main', data.inventory)
		} else if (data.action == 'setOtherInventory') {
			if (data.weight) {
				let current_weight = data.weight.current.toFixed(1)
				let max_weight = data.weight.max.toFixed(1)
				$('#other').find('.title').html(`${data.label}`)
				$('#other').find('.inv-weight').html(`Poids<hr/><span class="cur-weight">${current_weight}<span style="color: whitesmoke">KG</span></span><span class="max-weight">/ ${max_weight}KG</span>`)
			} else {
				$('#other').find('.title').html(`${data.label}`)
			}
			setupInventory($('#other'), 'other', data.inventory)
		}
	});

	$(document).keydown(e => {
		if (e.keyCode == 27 || e.keyCode == closeKey) {
			closeInventory();
		}
	});

	$('#give').click(function () {
		let item = $('.active').find('.item').data('item');

		if (!item) {
			return
		}

		let num = $('#count').val();
		let player = $('#players').val()

		if (!player) {
			return
		}

		if (item.type == 'item_weapon') {
			num = item.count
		}

		if (num < 0) {
			return
		}

		if (parseInt(num)) {
			$.post('https://inventory/give', JSON.stringify({
				item: item,
				count: num,
				player: player
			}))
		}

		if (num > item.count) {
			$.notify(`Insufficient Amount`, {
				position: "right bottom",
				autoHideDelay: 2500,
				className: 'error'
			});
			return
		}

		let newcount = item.count - num
		if (newcount == 0) {
			removeItem($('.active'))
			closeInfo()
		} else {
			if (item.type == 'item_money' || item.type == 'item_account') {
				$('.active').find('.item').find('.item-count').html(' &nbsp; $ ' + numberWithCommas(newcount));
			} else {
				$('.active').find('.item').find('.item-count').html(numberWithCommas(newcount));
			}
		}
	});

	$('#use').click(function () {
		let item = $('.active').find('.item').data('item');

		if (!item) {
			return
		}

		$.post('https://inventory/use', JSON.stringify({
			item: item
		}))

		let newcount = item.count - 1
		if (newcount == 0) {
			removeItem($('.active'))
			closeInfo()
		} else {
			if (item.type == 'item_money' || item.type == 'item_account') {
				$('.active').find('.item').find('.item-count').html(' &nbsp; $ ' + numberWithCommas(newcount));
			} else {
				$('.active').find('.item').find('.item-count').html(numberWithCommas(newcount));
			}
		}
	});

	$('#drop').click(function () {
		let item = $('.active').find('.item').data('item');

		if (!item) {
			return
		}

		let num = $('#count').val();

		if (num < 0) {
			return
		}

		if (parseInt(num)) {
			$.post('https://inventory/remove', JSON.stringify({
				item: item,
				count: num
			}))
		}

		if (item.type == 'item_weapon') {
			closeInfo()
			return
		}

		if (num > item.count) {
			$.notify(`Insufficient Amount`, {
				position: "right bottom",
				autoHideDelay: 2500,
				className: 'error'
			});
			return
		}

		let newcount = item.count - num
		if (newcount == 0) {
			removeItem($('.active'))
			closeInfo()
		} else {
			if (item.type == 'item_money' || item.type == 'item_account') {
				$('.active').find('.item').find('.item-count').html(' &nbsp; $ ' + numberWithCommas(newcount));
			} else {
				$('.active').find('.item').find('.item-count').html(numberWithCommas(newcount));
			}
		}
	});
});

function setupgunbar(gunbar) {
	$('.inv-gunbar').html(``);

	for (let i = 0; i < 5; i++) {
		$('.inv-gunbar').append(slotTemplate(i, true))
	}

	$.each(gunbar, (index, item) => {
		let slot = $('.inv-gunbar').find('.slot').filter(function () {
			return $(this).data('slot') == index
		})

		addItem(slot, item)

		slot.click(function () {
			$('.slot').removeClass('active');
			$(this).addClass('active');

			openInfo('gunbar', item)
		});

		slot.find('.item').draggable({
			zIndex: 1000,
			delay: 80,
			revert: 'invalid',
			revertDuration: 0,
			helper: 'clone',
			appendTo: 'body',
			cursorAt: {
				left: 60,
				top: 70
			},
			start: function (e, ui) {
				$(this).addClass('orginal');
				ui.helper.addClass('dragging');
			},
			stop: function (e, ui) {
				$(this).removeClass('orginal');
				ui.helper.removeClass('dragging');
			}
		})
	});

	$('.inv-gunbar').find('.slot').droppable({
		drop: function (e, ui) {
			let slot = $(this).data('slot');
			let item = ui.draggable.data('item');

			if (!item) {
				return
			}

			if (item.type == 'item_account' || item.type == 'item_money') {
				return
			}

			$.post('https://inventory/transferToGunbar', JSON.stringify({
				slot: slot,
				item: item
			}))

			if (useSound) {
				move.play();
			}

		}
	})

}

function setupInventory(inv, type, inventory) {
	let data = inv.find('.inv-data').find('.slots');
	inv.find('.inv-data').data('inventory', type);
	data.html('');

	if (inventory.length < 1) {
		data.parent().find('.no-items').fadeIn();
	} else {
		data.parent().find('.no-items').hide();
		$.each(inventory, (index, item) => {
			data.append(slotTemplate(index))

			let slot = data.find('.slot').filter(function () {
				return $(this).data('slot') == index
			})

			addItem(slot, item)

			slot.mousedown(function (e) {
				if (otherInv) {
					if (e.which == 3) {
						if (locked) {
							return
						}

						let item = $(this).find('.item').data('item');
						let currentInvType = $(this).parent().parent().data('inventory');

						if (!item) {
							return
						}

						if (currentInvType == 'main') {
							$.post('https://inventory/transferToOther', JSON.stringify({
								item: item,
								count: item.count
							}))
						} else {
							$.post('https://inventory/transferToPlayer', JSON.stringify({
								item: item,
								count: item.count
							}))
						}

						if (useSound) {
							move.play()
						}

						LockInventory()
						closeInfo()
					}
				}
			})

			slot.find('.item').draggable({
				zIndex: 1000,
				delay: 80,
				revert: 'invalid',
				revertDuration: 0,
				helper: 'clone',
				appendTo: 'body',
				cursorAt: {
					left: 60,
					top: 70
				},
				start: function (e, ui) {
					$(this).addClass('orginal');
					ui.helper.addClass('dragging');
				},
				stop: function (e, ui) {
					$(this).removeClass('orginal');
					ui.helper.removeClass('dragging');
				}
			})

			slot.click(function () {
				let item = $(this).find('.item').data('item');
				let inv = $(this).parent().parent().data('inventory');

				if (!item) {
					return
				}

				$('.slot').removeClass('active');
				$(this).addClass('active');

				openInfo(inv, item)
			})
		})
	}

	data.parent().droppable({
		hoverClass: 'hover',
		drop: function (e, ui) {
			if (locked) {
				return
			}

			let currentInvType = $(this).data('inventory');
			let dragInvType = ui.draggable.parent().parent().parent().data('inventory');
			let item = ui.draggable.data('item');

			let gunbarItem = ui.draggable.parent().data('gunbar');

			if (gunbarItem) {
				let slot = ui.draggable.parent().data('slot');
				$.post('https://inventory/removeFromgunbar', JSON.stringify({
					slot: slot
				}))
			} else {
				if (!item) {
					return
				}

				if (currentInvType == dragInvType) {
					return
				}

				let num = $('#count').val();

				if (!parseInt(num)) {
					return
				}

				if (num < 0) {
					return
				}

				if (num > item.count) {
					num = item.count
				}

				if (currentInvType == 'main') {
					$.post('https://inventory/transferToPlayer', JSON.stringify({
						item: item,
						count: num
					}))
				} else {
					$.post('https://inventory/transferToOther', JSON.stringify({
						item: item,
						count: num
					}))
				}

				if (useSound) {
					move.play()
				}
			}

			LockInventory()
			closeInfo()
		}
	})
}

function addItem(slot, item) {
	slot.find('.item-img').css('background-image', `url(./assets/items/${item.name}.png)`);
	if (item.type == 'item_weapon') {
		slot.find('.item').find('.item-count').html(' &nbsp; <i class="fas fa-angle-double-up"></i> ' + numberWithCommas(item.count));
	} else if (item.type == 'item_money' || item.type == 'item_account') {
		slot.find('.item').find('.item-count').html(' &nbsp; $ ' + numberWithCommas(item.count));
	} else {
		slot.find('.item').find('.item-count').html(' &nbsp; ' + numberWithCommas(item.count));
	}

	slot.find('.item').find('.item-name').html(item.label);
	slot.find('.item').data('item', item);
}

function removeItem(slot) {
	slot.find('.item').css('background-image', `none`);
	slot.find('.item').find('.item-count').html('');
	slot.find('.item').find('.item-name').html('');
	slot.find('.item').removeData('item');
}

function openInfo(inv, item) {
	$('.wrapper').show();

	$('.inv-actions-title').html(item.label);
	if (item.desc) {
		if (item.weight > 0) {
			$('.inv-actions-desc').html(item.desc + `<br><br><b>Weight: </b>${item.weight.toFixed(1)}kg | <b>Usable: </b>${item.usable} | <b>Droppable: </b>${Boolean(item.remove)}`);
		} else {
			$('.inv-actions-desc').html(item.desc + '<br>');
		}
	} else {
		$('.inv-actions-desc').html('No Description.');
	}

	$('#removegunbar').hide();

	if (inv == 'main') {
		if (item.usable) {
			$('#use').show();
		} else {
			$('#use').hide();
		}

		if (item.type != 'item_weapon') {
			$('#count').show();
			$('#drop').css('margin-left', '5px');
		} else {
			$('#count').hide();
			$('#drop').css('margin-left', 0);
		}

		if (item.remove) {
			$('#drop').show();
		} else {
			$('#drop').hide();
		}

		$('#give').show();
		$('#players').show();
	} else if (inv == 'gunbar') {
		$('#use').hide();
		$('#count').hide();
		$('#give').hide();
		$('#players').hide();
		$('#drop').hide();
		$('#removegunbar').show();
	} else {
		$('#drop').hide();
		$('#use').hide();
		$('#give').hide();
		$('#players').hide();

		if (item.type != 'item_weapon') {
			$('#count').show();
			$('#drop').css('margin-left', '5px');
		} else {
			$('#count').hide();
			$('.wrapper').hide();
			$('#drop').css('margin-left', 0);
		}
	}

	if (!info_open) {
		if (useSound) {
			click.play()
		}
	}
	info_open = true;
	$('.inv-actions').slideDown();
}



function slotTemplate(slotid, gunbar) {
	if (gunbar) {
		return (
			`<div class="slot" data-slot=${slotid} data-gunbar='true'>
                <div class="item">
					<div class="item-img"></div>
                    <div class="item-name"></div>
                </div>
            </div>`
		)
	} else {
		return (
			`<div class="slot" data-slot=${slotid}>
                <div class="item">
                    <div class="item-count"></div>
					<div class="item-img"></div>
                    <div class="item-name"></div>
                </div>
            </div>`
		)
	}

}

function closeInventory() {
	$('body').fadeOut(200);
	closeInfo();
	$.post('https://inventory/close');
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' &nbsp;';
}

function LockInventory() {
	locked = true
	setTimeout(() => {
		locked = false
	}, 500)
}
