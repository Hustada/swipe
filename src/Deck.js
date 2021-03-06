import React, { Component } from 'react';
import {
	View,
	Animated,
	PanResponder,
	Dimensions,
	LayoutAnimation,
	UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250

class Deck extends Component {
	static defaultProps = {
		onSwipeRight: () => {},
		onSwipeLeft: () => {}
	}


	constructor(props) {
		super(props);

		const position = new Animated.ValueXY();
		const panResponder = PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: (event, gesture) => {
				position.setValue({ x: gesture.dx, y: gesture.dy })
			},
			onPanResponderRelease: (event, gesture) => {
				if (gesture.dx > SWIPE_THRESHOLD) {
					this.forceSwipe('right');
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					this.forceSwipe('left');
				}  else {
				this.resetPosition();
				}
			}
		});

		this.state = { panResponder, position, index: 0 };
	}

//compare incoming data with existing props, reset index to 0 if not the same
	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.setState({index: 0});
		}
	}

	componentWillUpdate() {
		//if this function exists then call with a value of true(android)
		UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
		LayoutAnimation.spring();
	}

// force swipe, if x is right then force SCREEN WIDTH(right) else -SCREEN WIDTH(left)
	forceSwipe(direction) {
		const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
		Animated.timing(this.state.position, {
			toValue: { x, y: 0 },
			duration: SWIPE_OUT_DURATION
			//finish swipe on previous card
		}).start(() => this.onSwipeComplete(direction));
	}

	onSwipeComplete(direction) {
		const { onSwipeLeft, onSwipeRight, data } = this.props;
		const item = data[this.state.index];

		direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
		//reset position
		this.state.position.setValue({ x: 0, y: 0 });
		//get next card ready for swipe
		this.setState({ index: this.state.index + 1 });
	}

	//reset card if user releases
resetPosition() {
	Animated.spring(this.state.position, {
		toValue: { x: 0, y: 0 }
	}).start();
}

//card styling method
	getCardStyle() {
		const { position } = this.state;
		const rotate = position.x.interpolate({
			inputRange: [-SCREEN_WIDTH * 1.5,  0, SCREEN_WIDTH * 1.5],
			outputRange: ['-120deg', '0deg', '120deg']
		});

		return {
			...position.getLayout(),
			transform: [{ rotate }]
		};
	}

	renderCards() {
		if (this.state.index >= this.props.data.length) {
			return this.props.renderNoMoreCards();
		}

		return this.props.data.map((item, i) => {
			if (i < this.state.index) { return null; }

			if (i === this.state.index) {
				return (
					<Animated.View
						key={item.id}
						style={[this.getCardStyle()]}
						{...this.state.panResponder.panHandlers}
					>
						{this.props.renderCard(item)}
					</Animated.View>
				);
			}

			return (
				<Animated.View
					key={item.id}
					style={[styles.cardStyle, {top: 10 * (i - this.state.index) }]}>
					{this.props.renderCard(item)}
				</Animated.View>
				);
		}).reverse();
	} // reverse render so that cards stack in order(use Animated.View to prevent card flashing)


	render() {
		return (
			<View>
				{this.renderCards()}
			</View>
		);
	}
}

//stack cards using absolute positioning
const styles = {
	cardStyle: {
		position: 'absolute',
		width: SCREEN_WIDTH
	}
};


export default Deck;

