// add your JavaScript/D3 to this file

const rowConverter = function (d) {
  return {
    animalClass: d["Animal Class"],
    year: +d.year,
    month: +d.month,
    count: +d.count
    }
};  

d3.csv("https://raw.githubusercontent.com/Miki273/NYCAnimalRescue/main/d3plot_data.csv", rowConverter).then(function(data) {
    let userLineData = [];
    let lastPoint = null;
    
    function updateGraph(selectedClass) {
        const filteredData = data.filter(d => d.animalClass == selectedClass);
        
        const first2023Point = filteredData.find(d => d.year == 2023 && d.count > 0);
        const firstValidDate = new Date(first2023Point.year, first2023Point.month - 1);
        const lastValidDate = new Date(2024, 12 - 1);
        
        const originalLineData = filteredData.filter(d => (d.year < 2023) || (d.year == 2023 && d.month <= first2023Point.month));
        const hiddenLineData = filteredData.filter(d => d.year >= 2023);
        
        const lastOriginalPoint = originalLineData[originalLineData.length - 1];

        x.domain(d3.extent(filteredData, d => new Date(d.year, d.month - 1)));
        y.domain([0, d3.max(filteredData, d => d.count)]);

        xAxis.call(d3.axisBottom(x).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y")))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");;
        yAxis.call(d3.axisLeft(y));

        svg.select(".line")
          .datum(originalLineData)
          .transition()
          .duration(750)
          .attr("d", line);
          
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .attr("pointer-events", "all")
            .on("click", function(event) {
            const [xPos, yPos] = d3.pointer(event);

            let clickedDate = x.invert(xPos);
            const clickedCount = y.invert(yPos);
            if (clickedDate <= firstValidDate) {
                console.log("Invalid click: Click must be after", firstValidDate);
                return;
            }
            if (clickedDate > lastValidDate) {
              console.log("Invalid click: Click must be before or on", lastValidDate);
              return; 
            }
            
            if (!lastPoint) {
                
                lastPoint = {
                    date: new Date(lastOriginalPoint.year, lastOriginalPoint.month - 1),
                    count: lastOriginalPoint.count
                };
            }
            
            clickedDate = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1);
            if (clickedDate <= lastPoint.date) {
                console.log("Adjusting point: Clicked date is before or same as the previous point.");
                clickedDate = new Date(lastPoint.date.getFullYear(), lastPoint.date.getMonth() + 1);
                console.log("Adjusted date:", clickedDate);
            } 


            const newPoint = { date: clickedDate, count: clickedCount };
            
            userLineData.push(lastPoint, newPoint);
            
            svg.append("path")
                .datum([lastPoint, newPoint])
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.count)));

            lastPoint = newPoint;
            console.log("lastpoint:", lastPoint.date);

        
            d3.select("#check").style("display", "block");
        });
        
        d3.select("#check").on("click", function() {
            svg.append("path")
                .datum(hiddenLineData)
                .attr("fill", "none")
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("d", line);

            d3.select(this).style("display", "none");
        });
    }
    
    updateGraph("Birds");
    d3.selectAll("input[name='animalClass']").on("change", function() {
        userLineData = []; 
        lastPoint = null;  
        svg.selectAll("path:not(.line)").remove(); 
        d3.select("#check").style("display", "none"); 
        updateGraph(this.value);
    });
});

const margin = {top: 20, right: 30, bottom: 80, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("div#plot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
            
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g")
              .attr("transform", `translate(0,${height})`);

const yAxis = svg.append("g");

// X-axis label
svg.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom-15) 
  .text("Time");


svg.append("text")
  .attr("class", "y-axis-label")
  .attr("text-anchor", "middle")
  .attr("transform", `rotate(-90)`) 
  .attr("x", -height / 2) 
  .attr("y", -margin.left + 15) 
  .text("Number of Incident Calls");


const line = d3.line()
             .x(d => x(new Date(d.year, d.month - 1)))
             .y(d => y(d.count));

svg.append("path")
   .attr("class", "line");