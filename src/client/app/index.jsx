import {render} from 'react-dom';
import Visualizer from './Visualizer.jsx';

import 'normalize-css/normalize.css';
import 'vis/dist/vis.min.css';
import '../themes/main.css';

render(<Visualizer/>, document.getElementById('visualizer'));
