'use strict';

angular.module('rb.ui', ['monospaced.elastic'])

.constant('KEYCODE', {
	ENTER:  13,
	TAB:    9,
	ESC:    27
})

.constant('DURATION', {
	SECOND: 1,
	MINUTE: 60,
	HOUR: 60 * 60,
	DAY: 60 * 60 * 24,
	WEEK: 60 * 60 * 24 * 7,
	MONTH: 60 * 60 * 24 * 7 * 30,
	YEAR: 60 * 60 * 24 * 7 * 30 * 12
})

.filter('elapsedTime', ['DURATION', function(DURATION){
	return function(timestamp) {
		var elapsed = (Date.now() - timestamp) / 1000;

		function format(duration, label) {
			if( duration > 1 ) {
				return duration + ' ' + label + 's ago';
			} else {
				return duration + ' ' + label + ' ago';
			}
		}

		if( timestamp === null ) { return ''; }

		if( elapsed < DURATION.SECOND ) {
			return 'Just now';
		} else if( elapsed < DURATION.MINUTE ) {
			return format(Math.floor(elapsed), 'second');
		} else if( elapsed < DURATION.HOUR ) {
			return format(Math.floor(elapsed / DURATION.MINUTE), 'minute');
		} else if( elapsed < DURATION.DAY ) {
			return format(Math.floor(elapsed / DURATION.HOUR), 'hour');
		} else if( elapsed < DURATION.WEEK ) {
			return format(Math.floor(elapsed / DURATION.DAY), 'day');
		} else if( elapsed < DURATION.MONTH ) {
			return format(Math.floor(elapsed / DURATION.WEEK), 'week');
		} else if( elapsed < DURATION.YEAR ) {
			return format(Math.floor(elapsed / DURATION.MONTH), 'month');
		} else {
			return format(Math.floor(elapsed / DURATION.YEAR), 'year');
		}
	};

}])

.factory('formatDate', function(){
	return function formatDate(date, fmt) {
		return fmt.replace(/%([a-zA-Z])/g, function (_, fmtCode) {
			switch (fmtCode) {
			case 'Y':
				return date.getUTCFullYear();
			case 'M':
				return pad(date.getUTCMonth() + 1);
			case 'd':
				return pad(date.getUTCDate());
			case 'H':
				return pad(date.getUTCHours());
			case 'm':
				return pad(date.getUTCMinutes());
			case 's':
				return pad(date.getUTCSeconds());
			default:
				throw new Error('Unsupported format code: ' + fmtCode);
			}
		});
	};

	function pad(value) {
		return (value.toString().length < 2) ? '0' + value : value;
	}
})

.filter('markdown', [function(){
	return function(markdown) {
		if( markdown === undefined || markdown === null ) { return ''; }
		return marked.parse(markdown);
	};
}])

.directive('rbMarkdown', ['$filter', function($filter){
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: true,
		template:
			'<div ng-show="display()"></div>' +
			'<textarea ng-show="edit()" rb-editor msd-elastic></textarea>',
		link: function(scope, element, attr) {

			element.attr('tabindex', '-1');

			scope.state = 'display';
			scope.display = function() { return scope.state === 'display'; };
			scope.edit = function() { return scope.state === 'edit'; };

			scope.$watch(attr.ngModel, function(val){
				element.find('div').html($filter('markdown')(val));
			});

			element.bind('focus', function(evt){
				evt.preventDefault();
				scope.$apply(function(){ scope.state = 'edit'; });
				element.find('textarea')[0].focus();
			});

			element.find('textarea').bind('blur', function(){
				scope.$apply(function(){
					scope.state = 'display';
					scope.$eval(attr.rbMarkdown);
				});
			});
		}
	};
}])

.directive('rbEditor', ['$filter', 'KEYCODE', function($filter, KEYCODE){
	return {
		restrict: 'A',
		require: '^ngModel',
		link: function(scope, element, attr, ngModel) {

			ngModel.$render = render;

			element.bind('focus', function(){
				render();
			});

			element.bind('keyup', function keyup(evt){
				if( shouldCancelEdit(evt) ) {
					evt.preventDefault();
					element[0].blur();
				}
				if( shouldSubmitEdit(evt) ) {
					evt.preventDefault();
					scope.$apply(update);
					element[0].blur();
				}
			});

			function update() { ngModel.$setViewValue(element.val()); }
			function render() { element.val(ngModel.$viewValue || ''); }

			function shouldCancelEdit(evt) { return evt.keyCode === KEYCODE.ESC; }
			function shouldSubmitEdit(evt) { return evt.keyCode === KEYCODE.ENTER && evt.ctrlKey; }
		}
	};
}])

.directive('rbBlur', [function(){
	return {
		restrict: 'A',
		link: function rbBlur(scope, elem, attr) {
			elem.bind('blur', function applyOnBlur() {
				scope.$apply(attr.rbBlur);
			});
		}
	};
}])

.directive('rbFocus', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		link: function(scope, element, attr){
			scope.$watch(attr.rbFocus, function(value) {
				if(value === false) { return; }
				$timeout(function() { element[0].focus(); });
			});
		}
	};
}])

.value('hotkeyScope', {active: {}})

.factory('stealHotkeys', ['hotkeyScope', function(hotkeyScope){
	return function(name, scope) {
		scope.$on('$stateChangeSuccess', stealHotkeys(name, scope));
	};

	function stealHotkeys(name, scope){
		return function(event, toState) {
			if( name === toState.name ) {
				hotkeyScope.active = scope;
			}
		};
	}
}])

.directive('rbHotkeys', ['hotkeyScope', function(hotkeyScope){
	var handlers = {};

	return {
		restrict: 'A',
		link: function(scope, element, attr){
			angular.forEach(scope.$eval(attr.rbHotkeys), proxyKeypress);

			scope.$on('$destroy', destroy);

			function proxyKeypress(info, keypress) {
				var scopeKey = info.global ? 'global' : scope.$id;
				if( info.event === undefined ) { return; }
				if( handlers[keypress] === undefined ) { bind(keypress); }
				handlers[keypress][scopeKey] = handler(scope, info);
			}

			function destroy() {
				angular.forEach(scope.$eval(attr.rbHotkeys), removeHandler(scope));
			}
		}
	};

	function bind(keypress) {
		handlers[keypress] = {};
		Mousetrap.bind(prepKey(keypress), dispatchKeypress);
	}

	function handler(scope, info) {
		return function(evt) {
			scope.$apply(function(){ scope.$broadcast(info.event, info); });
		};
	}

	function dispatchKeypress(evt, keypress) {
		var handler = handlers[keypress].global || handlers[keypress][hotkeyScope.active.$id];
		(handler || function(){})(evt);
	}

	function removeHandler(scope) {
		return function(info, keypress) {
			if( info.event === undefined ) { return; }

			delete handlers[keypress][info.global ? 'global' : scope.$id];

			if( Object.keys(handlers[keypress]).length === 0 ) {
				delete handlers[keypress];
				Mousetrap.unbind(prepKey(keypress));
			}
		};
	}

	function prepKey(keypress) {
		return keypress.indexOf(',') !== -1 ? asArray(keypress, ',') : keypress;
	}

	function asArray(str, delimiter) {
		return str.split(delimiter).map(function(key){ return key.trim(); });
	}
}])

.directive('rbScrollTo', [function(){
	var html = document.querySelector('html'),
		body = document.body;
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			scope.$watch(attr.rbScrollTo, function(value) {
				if(value === 0 || isElementInViewport(element[0])) { return; }
				element[0].scrollIntoView(value === -1 ? true : false);
				// firefox and IE
				html.scrollTop = html.scrollTop + (value === 1 ? 10 : -10);
				// chrome
				body.scrollTop = body.scrollTop + (value === 1 ? 10 : -10);
				// always doing both doesn't seem to be problematic
			});
		}
	};

	function isElementInViewport(el) {
		var rect = el.getBoundingClientRect();

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document. documentElement.clientWidth)
		);
	}
}])

.directive('rbAlerts', [function(){
	return {
		restrict: 'A',
		templateUrl: 'partials/alerts.html',
		scope: {
			alerts: '=rbAlerts'
		},
		link: function(scope, element, attr) {
			scope.closeAlert = function byIndex(index) {
				scope.alerts.splice(index, 1);
			};
		}
	};
}]);
