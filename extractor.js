function extract_data(svg_graph_element) {
    let input_datasets = svg_graph_element.querySelectorAll('.dataset');
    let output_datasets = [];
    for (let dataset of input_datasets) {
        let output_dataset = [];
        if (dataset.classList.contains("scatterplot")) {
            for (let child of dataset.children) {
                output_dataset.push([
                    parseFloat(child.getAttribute("cx")),
                    parseFloat(child.getAttribute("cy"))
                ]);
            }
        }
        output_datasets.push(output_dataset);
    }
    return output_datasets;
}