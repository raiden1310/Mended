// Keep the selected item's data available even when all review sections are closed.
export function selectItem(state,index,accordion=false) {
 state.reviewCollapsed=state.screen==='review' && accordion && state.active===index ? !state.reviewCollapsed : false;
 state.active=index;
}
