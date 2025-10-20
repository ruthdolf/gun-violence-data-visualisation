let cleaned_incidents = [];
let cleaned_voting = [];
let state_pop = new Map();

const svg = d3.select("svg");

// Define bivariate color scale
const colorScale = d3.scaleOrdinal()
    .domain(["00","01","02","10","11","12","20","21","22"])
    .range([
        "#e8e8e8","#e4acac","#c85a5a",
        "#b0d5df","#ad9ea5","#985356",
        "#64acbe","#627f8c","#574249"
    ]);

// Load incidents data
d3.csv("all_incidents.csv").then(parsedData => {
    let filteredData = parsedData.filter(d => {
        let year = parseInt(d.date.split("-")[0]);
        return year >= 2019 && year <= 2020;
    });

    let stateCount = d3.rollup(filteredData, v => v.length, d => d.state.trim());
    cleaned_incidents = Array.from(stateCount, ([State, Count]) => ({ State, Count }));

    loadPopulationData();
}).catch(error => console.error(error));

// Load population
function loadPopulationData() {
    d3.csv("us_pop_by_state.csv").then(popData => {
        popData.forEach(d => {
            state_pop.set(d.state.trim(), parseInt(d["2020_census"]));
        });
        computeIncidentRate();
    }).catch(error => console.error(error));
}

// Compute incident rates
function computeIncidentRate() {
    cleaned_incidents = cleaned_incidents.map(incident => {
        let pop = state_pop.get(incident.State) || null;
        let rate = pop ? (incident.Count / pop) * 10000 : null;
        return { State: incident.State, Incident_Rate: rate };
    });
    checkAndMerge();
}

// Load voting data
d3.csv("voting.csv").then(parsedData => {
    cleaned_voting = parsedData.map(d => ({
        State: d.state.trim(),
        Trump_Percentage: parseFloat(d.trump_pct)
    }));
    checkAndMerge();
}).catch(error => console.error(error));

function checkAndMerge() {
    if (cleaned_incidents.length && cleaned_voting.length && state_pop.size) mergeData();
}

// Merge datasets
function mergeData() {
    let mergedData = cleaned_incidents.map(incident => {
        let vote = cleaned_voting.find(v => v.State === incident.State);
        return {
            State: incident.State,
            Incident_Rate: incident.Incident_Rate,
            Trump_Percentage: vote ? vote.Trump_Percentage : null
        };
    });
    drawMap(mergedData);
}

// Draw map
function drawMap(data) {
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json").then(us => {
        const states = topojson.feature(us, us.objects.states).features;
        const stateMap = new Map(data.map(d => [d.State,d]));

        const incidentValues = data.map(d => d.Incident_Rate).sort((a,b)=>a-b);
        const qIncidents = [d3.quantile(incidentValues,0.33), d3.quantile(incidentValues,0.66)];
        const votingValues = data.map(d => d.Trump_Percentage).sort((a,b)=>a-b);
        const qVoting = [d3.quantile(votingValues,0.33), d3.quantile(votingValues,0.66)];

        function classify(ir,tp){
            let iClass = ir < qIncidents[0] ? "0" : ir < qIncidents[1] ? "1":"2";
            let vClass = tp < qVoting[0] ? "0" : tp < qVoting[1] ? "1":"2";
            return iClass+vClass;
        }

        const tooltip = d3.select("body").append("div")
            .attr("id","tooltip")
            .style("position","absolute")
            .style("visibility","hidden")
            .style("background","#FAF7F7")
            .style("color","#785D5E")
            .style("font-family","Helvetica")
            .style("padding","8px")
            .style("border-radius","5px")
            .style("font-size","18px")
            .style("pointer-events","none");

        svg.append("g")
            .selectAll("path")
            .data(states)
            .join("path")
            .attr("class","state")
            .attr("d", d3.geoPath())
            .attr("fill", d => {
                const s = stateMap.get(d.properties.name);
                return s ? colorScale(classify(s.Incident_Rate,s.Trump_Percentage)):"#ccc";
            })
            .on("mouseover",(event,d)=>{
                d3.select(event.target).style("stroke","#7C6673").style("stroke-width",2);
                const s = stateMap.get(d.properties.name);
                if(s){
                    tooltip.html(`<strong>${s.State}</strong><br>
                                  Gun Rate: ${s.Incident_Rate.toFixed(2)}<br>
                                  Republicans: ${s.Trump_Percentage?.toFixed(2)??"N/A"}%`)
                           .style("visibility","visible");
                }
            })
            .on("mousemove",event=>{
                tooltip.style("top",(event.pageY+10)+"px")
                       .style("left",(event.pageX+10)+"px");
            })
            .on("mouseout",event=>{
                d3.select(event.target).style("stroke","white").style("stroke-width",1);
                tooltip.style("visibility","hidden");
            });

        drawLegend();
    });
}

// Draw legend
function drawLegend(){
    const legendData = d3.cross([0,1,2],[0,1,2]);
    const legend = svg.append("g")
        .attr("transform","translate(900,500) rotate(-135)");

    legend.selectAll("rect")
        .data(legendData)
        .join("rect")
        .attr("x",([a,b])=>b*30)
        .attr("y",([a,b])=>a*30)
        .attr("width",30)
        .attr("height",30)
        .attr("fill",d=>colorScale(d.join("")))
        .attr("stroke","black");

    legend.append("text")
        .attr("x",-45)
        .attr("y",15)
        .attr("text-anchor","middle")
        .attr("fill","black")
        .attr("transform","rotate(180)")
        .style("font-size","16px")
        .style("font-family","Helvetica")
        .text("← Republicans");

    legend.append("text")
        .attr("x",45)
        .attr("y",15)
        .attr("text-anchor","middle")
        .attr("fill","black")
        .attr("transform","rotate(90)")
        .style("font-size","16px")
        .style("font-family","Helvetica")
        .text("Gun Rate →");
}
