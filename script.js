let cleaned_incidents = [];
let cleaned_voting = [];
let state_pop = new Map();

const svg = d3.select("svg");

// Bivariate color scale
const colorScale = d3.scaleOrdinal()
    .domain(["00","01","02","10","11","12","20","21","22"])
    .range([
        "#e8e8e8","#e4acac","#c85a5a",
        "#b0d5df","#ad9ea5","#985356",
        "#64acbe","#627f8c","#574249"
    ]);

// Load incidents
d3.csv("../dataset/all_incidents.csv")
    .then(parsedData => {
        const filteredData = parsedData.filter(d => {
            const year = parseInt(d.date.split("-")[0]);
            return year >= 2019 && year <= 2020;
        });

        const stateCount = d3.rollup(filteredData, v => v.length, d => d.state.trim());
        cleaned_incidents = Array.from(stateCount, ([State, Count]) => ({ State, Count }));
        loadPopulationData();
    })
    .catch(error => console.error(error));

// Load population
function loadPopulationData() {
    d3.csv("../dataset/us_pop_by_state.csv")
        .then(popData => {
            popData.forEach(d => {
                state_pop.set(d.state.trim(), parseInt(d["2020_census"]));
            });
            computeIncidentRate();
        })
        .catch(error => console.error(error));
}

// Compute incident rates
function computeIncidentRate() {
    cleaned_incidents = cleaned_incidents.map(incident => {
        const pop = state_pop.get(incident.State) || null;
        const rate = pop ? (incident.Count / pop) * 10000 : null;
        return { State: incident.State, Incident_Rate: rate };
    });
    checkAndMerge();
}

// Load voting
d3.csv("../dataset/voting.csv")
    .then(parsedData => {
        cleaned_voting = parsedData.map(d => ({
            State: d.state.trim(),
            Trump_Percentage: parseFloat(d.trump_pct)
        }));
        checkAndMerge();
    })
    .catch(error => console.error(error));

function checkAndMerge() {
    if (cleaned_incidents.length && cleaned_voting.length && state_pop.size) mergeData();
}

// Merge datasets
function mergeData() {
    const mergedData = cleaned_incidents.map(incident => {
        const vote = cleaned_voting.find(v => v.State === incident.State);
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
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json")
        .then(us => {
            const states = topojson.feature(us, us.objects.states).features;
            const stateMap = new Map(data.map(d => [d.State,d]));

            const incidentValues = data.map(d => d.Incident_Rate).sort((a,b)=>a-b);
            const minIncident = d3.min(incidentValues);
            const lowerQuantile = d3.quantile(incidentValues,0.33);
            const upperQuantile = d3.quantile(incidentValues,0.66);
            const maxIncident = d3.max(incidentValues);

            const votingValues = data.map(d => d.Trump_Percentage).sort((a,b)=>a-b);
            const qVoting = [d3.quantile(votingValues,0.33), d3.quantile(votingValues,0.66)];

            function classify(ir,tp){
                const iClass = ir < lowerQuantile ? "0" : ir < upperQuantile ? "1":"2";
                const vClass = tp < qVoting[0] ? "0" : tp < qVoting[1] ? "1":"2";
                return iClass+vClass;
            }

            const tooltip = d3.select("body").append("div")
                .attr("id","tooltip");

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

            drawLegend(minIncident, lowerQuantile, upperQuantile,maxIncident);
        });
}

// Draw legend
function drawLegend(minIncident, lowerQuantile, upperQuantile, maxIncident){
    const legendData = d3.cross([0,1,2],[0,1,2]);
    const legend = svg.append("g")
        .attr("transform","translate(1000,300)");

    legend.selectAll("rect")
        .data(legendData)
        .join("rect")
        .attr("x",([a,b])=>b*35)
        .attr("y",([a,b])=>(2-a)*35)
        .attr("width",35)
        .attr("height",35)
        .attr("fill",d=>colorScale(d.join("")))
        .attr("stroke","black");

    //gun rate margin
    legend.append("text")
        .attr("x",15)
        .attr("y",55)
        .attr("class","legend-description")
        .attr("transform","rotate(90)")
        .text("The number of gun violence incidents per thousand");

    legend.append("text")
        .attr("x", -30)
        .attr("y", 107)
        .attr("class","legend-value")
        .text(minIncident.toFixed(2));

    legend.append("text")
        .attr("x", -30)
        .attr("y", 70)
        .attr("class","legend-value")
        .text(lowerQuantile.toFixed(2));

    legend.append("text")
        .attr("x", -30)
        .attr("y", 40)
        .attr("class","legend-value")
        .text(upperQuantile.toFixed(2));
    
    legend.append("text")
        .attr("x", -30)
        .attr("y", 10)
        .attr("class","legend-value")
        .text(maxIncident.toFixed(2));

    //republican votes margin
    legend.append("text")
        .attr("x",-45)
        .attr("y",150)
        .attr("class","legend-description")
        //.attr("transform","rotate(180)")
        .text("The number of republican votes in 2020");
}
