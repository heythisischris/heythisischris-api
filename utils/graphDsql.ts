import { parse } from 'graphql/language';
import { dsql } from './dsql';

const SCHEMA = {
    users: {
        columns: ['id', 'created_at', 'name'],
        relationships: {
            projects: {
                type: 'hasMany',
                table: 'projects',
                foreignKey: 'user_id',
                // Allow filtering on related data
                filter: {
                    columns: ['name', 'created_at', 'status'],
                    operators: ['_eq', '_like', '_gt', '_lt', '_gte', '_lte']
                }
            },
            projects_aggregate: {
                type: 'aggregate',
                table: 'projects',
                foreignKey: 'user_id',
                aggregates: ['count', 'avg', 'sum', 'min', 'max']
            },
        }
    },
    projects: {
        columns: ['id', 'created_at', 'user_id', 'name', 'status'],
        relationships: {
            user: {
                type: 'belongsTo',
                table: 'users',
                foreignKey: 'user_id'
            },
            tasks: {
                type: 'hasMany',
                table: 'tasks',
                foreignKey: 'project_id',
                filter: {
                    columns: ['title', 'status', 'priority'],
                    operators: ['_eq', '_like', '_in']
                }
            },
            tasks_aggregate: {
                type: 'aggregate',
                table: 'tasks',
                foreignKey: 'project_id',
                aggregates: ['count', 'avg', 'sum']
            }
        }
    },
    tasks: {
        columns: ['id', 'created_at', 'project_id', 'title', 'status', 'priority'],
        relationships: {
            project: {
                type: 'belongsTo',
                table: 'projects',
                foreignKey: 'project_id'
            },
        }
    }
};

type QueryResult = {
    text: string;
    values: any[];
};

type GraphQLResult = {
    [key: string]: any;
};

type QueryBuilderState = {
    joins: Set<string>;
    fields: string[];
    params: any[];
    paramCount: number;
};

const parseSelectionSet = (selectionSet: any, parentTable: string) => {
    const selections = selectionSet.selections.map(selection => {
        const fieldName = selection.name.value;

        // If it's a simple field
        if (!selection.selectionSet) {
            console.log('Found scalar field:', fieldName);
            return {
                field: fieldName,
                alias: selection.alias?.value || fieldName,
                type: 'scalar'
            };
        }

        // If it's a relationship
        const relationship = SCHEMA[parentTable]?.relationships?.[fieldName];
        console.log(JSON.stringify({ parentTable, fieldName, selection }))
        if (relationship) {
            return {
                field: fieldName,
                alias: selection.alias?.value || fieldName,
                type: 'relationship',
                relationshipType: relationship.type,
                foreignTable: relationship.table,
                foreignKey: relationship.foreignKey,
                selections: parseSelectionSet(selection.selectionSet, relationship.table)
            };
        }

        // If it's an aggregate
        if (fieldName === 'aggregate') {
            return {
                field: 'aggregate',
                type: 'aggregate',
                selections: selection.selectionSet.selections.map(aggField => ({
                    field: aggField.name.value,
                    selections: aggField.selectionSet?.selections.map(f => f.name.value)
                }))
            };
        }

        return null;
    }).filter(Boolean);

    return selections;
};

const generateFieldSelectionWithJoins = (
    selections: any[],
    table: string,
    tableAlias: string,
    state: QueryBuilderState,
    parentPath = ''
): void => {
    selections.forEach(selection => {
        if (selection.type === 'scalar') {
            state.fields.push(
                `${tableAlias}.${selection.field} as "${parentPath}${selection.field}"`
            );
        } else if (selection.type === 'relationship') {
            const joinAlias = `${parentPath}${selection.field}_${Math.random().toString(36).substr(2, 9)}`;
            const relationship = SCHEMA[table].relationships[selection.field];

            if (relationship.type === 'manyToMany') {
                // Handle many-to-many relationships
                const throughAlias = `${joinAlias}_through`;
                const joinCondition = `
                    LEFT JOIN ${relationship.through} ${throughAlias} 
                        ON ${tableAlias}.id = ${throughAlias}.${relationship.foreignKey}
                    LEFT JOIN ${relationship.table} ${joinAlias} 
                        ON ${throughAlias}.${relationship.targetKey} = ${joinAlias}.id
                `;
                state.joins.add(joinCondition);
            } else {
                // Handle one-to-many and many-to-one relationships
                let joinCondition: string;
                if (relationship.type === 'belongsTo') {
                    joinCondition = `
                        LEFT JOIN ${relationship.table} ${joinAlias} 
                            ON ${tableAlias}.${relationship.foreignKey} = ${joinAlias}.id
                    `;
                } else {
                    joinCondition = `
                        LEFT JOIN ${relationship.table} ${joinAlias} 
                            ON ${tableAlias}.id = ${joinAlias}.${relationship.foreignKey}
                    `;
                }

                // Add default filter if specified
                if (relationship.defaultFilter) {
                    joinCondition += ` AND (${relationship.defaultFilter})`;
                }

                state.joins.add(joinCondition);
            }

            // Recurse for nested selections
            generateFieldSelectionWithJoins(
                selection.selections,
                relationship.table,
                joinAlias,
                state,
                `${parentPath}${selection.field}_`
            );
        } else if (selection.type === 'aggregate') {
            // Handle aggregates within relationships
            // const relationship = SCHEMA[table].relationships[selection.field.replace('_aggregate', '')];
            // const aggAlias = `${parentPath}${selection.field}_${Math.random().toString(36).substr(2, 9)}`;

            selection.selections.forEach(aggSelection => {
                if (aggSelection.field === 'count') {
                    state.fields.push(
                        `COUNT(DISTINCT ${tableAlias}.id) as "${parentPath}${selection.field}_count"`
                    );
                } else {
                    aggSelection.selections.forEach(field => {
                        state.fields.push(
                            `${aggSelection.field.toUpperCase()}(${tableAlias}.${field}) as "${parentPath}${selection.field}_${aggSelection.field}_${field}"`
                        );
                    });
                }
            });
        }
    });
};

const generateWhereClause = (
    where: any = {},
    table: string,
    tableAlias: string,
    state: QueryBuilderState
): string => {
    if (!where || Object.keys(where).length === 0) {
        return '1=1';
    }

    const conditions = [];

    for (const [key, value] of Object.entries(where)) {
        // Handle relationship filters
        if (SCHEMA[table].relationships?.[key]) {
            const relationship = SCHEMA[table].relationships[key];
            const relationshipAlias = `${key}_${Math.random().toString(36).substr(2, 9)}`;

            // Add join if not already present
            const joinCondition = `
                LEFT JOIN ${relationship.table} ${relationshipAlias} 
                    ON ${tableAlias}.id = ${relationshipAlias}.${relationship.foreignKey}
            `;
            state.joins.add(joinCondition);

            // Recursively handle nested where conditions
            const nestedWhere = generateWhereClause(
                value,
                relationship.table,
                relationshipAlias,
                state
            );
            conditions.push(`(${nestedWhere})`);
        }
        // Handle regular column filters
        else if (typeof value === 'object') {
            for (const [op, val] of Object.entries(value)) {
                conditions.push(buildOperatorCondition(
                    `${tableAlias}.${key}`,
                    op,
                    val,
                    state
                ));
            }
        } else {
            state.paramCount++;
            state.params.push(value);
            conditions.push(`${tableAlias}.${key} = $${state.paramCount}`);
        }
    }

    return conditions.join(' AND ');
};

const buildOperatorCondition = (
    field: string,
    operator: string,
    value: any,
    state: QueryBuilderState
): string => {
    const operators = {
        _eq: '=',
        _neq: '!=',
        _gt: '>',
        _gte: '>=',
        _lt: '<',
        _lte: '<=',
        _in: 'IN',
        _nin: 'NOT IN',
        _like: 'LIKE',
        _ilike: 'ILIKE',
        _is_null: 'IS NULL',
        _contains: '@>'
    };

    const op = operators[operator];
    if (!op) throw new Error(`Unsupported operator: ${operator}`);

    if (operator === '_is_null') {
        return value ? `${field} IS NULL` : `${field} IS NOT NULL`;
    }

    state.paramCount++;
    state.params.push(value);
    return `${field} ${op} $${state.paramCount}`;
};

const generateListQuery = (queryName: string, args: any, selectionSet: any): QueryResult => {
    const table = queryName;
    const tableAlias = table;

    const state: QueryBuilderState = {
        joins: new Set<string>(),
        fields: [],
        params: [],
        paramCount: 0
    };

    const selections = parseSelectionSet(selectionSet, table);
    generateFieldSelectionWithJoins(selections, table, tableAlias, state);

    const where = generateWhereClause(
        args.where,
        table,
        tableAlias,
        state
    );

    const orderBy = args.order_by?.map(o => {
        const [field, direction] = Object.entries(o)[0];
        if (field.includes('.')) {
            // Handle ordering by related fields
            const [relation, relationField] = field.split('.');
            const relationAlias = `${relation}_order_${Math.random().toString(36).substr(2, 9)}`;
            const relationship = SCHEMA[table].relationships[relation];

            state.joins.add(`
                LEFT JOIN ${relationship.table} ${relationAlias} 
                    ON ${tableAlias}.id = ${relationAlias}.${relationship.foreignKey}
            `);

            return `${relationAlias}.${relationField} ${direction}`;
        }
        return `${tableAlias}.${field} ${direction}`;
    }).join(', ') || `${tableAlias}.created_at DESC`;

    const limit = args.limit || 10;
    const offset = args.offset || 0;

    return {
        text: `
            WITH RECURSIVE hierarchical_query AS (
                SELECT DISTINCT ON (${tableAlias}.id)
                    ${state.fields.join(',\n')}
                FROM ${table} ${tableAlias}
                ${Array.from(state.joins).join('\n')}
                WHERE ${where}
                ORDER BY ${tableAlias}.id, ${orderBy}
                LIMIT ${limit} OFFSET ${offset}
            )
            SELECT * FROM hierarchical_query
        `,
        values: state.params
    };
};

const generateByPkQuery = (queryName: string, args: any, selectionSet: any): QueryResult => {
    const table = queryName.replace('_by_pk', '');
    const tableAlias = table;

    const state: QueryBuilderState = {
        joins: new Set<string>(),
        fields: [],
        params: [args.id],
        paramCount: 1
    };

    const selections = parseSelectionSet(selectionSet, table);
    generateFieldSelectionWithJoins(selections, table, tableAlias, state);

    return {
        text: `
            WITH RECURSIVE hierarchical_query AS (
                SELECT DISTINCT ON (${tableAlias}.id)
                    ${state.fields.join(',\n')}
                FROM ${table} ${tableAlias}
                ${Array.from(state.joins).join('\n')}
                WHERE ${tableAlias}.id = $1
                LIMIT 1
            )
            SELECT * FROM hierarchical_query
        `,
        values: state.params
    };
};

const generateAggregateQuery = (queryName: string, args: any, selectionSet: any): QueryResult => {
    const table = queryName.replace('_aggregate', '');
    const tableAlias = table;

    const state: QueryBuilderState = {
        joins: new Set<string>(),
        fields: [],
        params: [],
        paramCount: 0
    };

    const selections = parseSelectionSet(selectionSet, table);
    const aggregateSelections = selections.find(s => s.type === 'aggregate')?.selections || [];

    // Build aggregate selections
    aggregateSelections.forEach(aggField => {
        if (aggField.field === 'count') {
            state.fields.push('COUNT(*) as count');
        } else {
            (aggField.selections || []).forEach(field => {
                state.fields.push(
                    `${aggField.field.toUpperCase()}(${tableAlias}.${field}) as "${aggField.field}_${field}"`
                );
            });
        }
    });

    // Handle where clause
    const where = generateWhereClause(args.where, table, tableAlias, state);

    return {
        text: `
            SELECT
                ${state.fields.join(',\n')}
            FROM ${table} ${tableAlias}
            ${Array.from(state.joins).join('\n')}
            WHERE ${where}
        `,
        values: state.params
    };
};

const generateSQLQuery = (queryName: string, args: any, selectionSet: any): QueryResult => {
    if (queryName.endsWith('_by_pk')) {
        return generateByPkQuery(queryName, args, selectionSet);
    } else if (queryName.endsWith('_aggregate')) {
        return generateAggregateQuery(queryName, args, selectionSet);
    } else {
        return generateListQuery(queryName, args, selectionSet);
    }
};

const transformResult = (rows: any[], queryName: string, selectionSet: any): GraphQLResult => {
    if (queryName.endsWith('_by_pk')) {
        return transformSingleResult(rows[0], selectionSet);
    } else if (queryName.endsWith('_aggregate')) {
        return transformAggregateResult(rows[0], selectionSet);
    } else {
        // Group rows by parent entities and transform nested relationships
        return transformListResult(rows, selectionSet);
    }
};

const transformListResult = (rows: any[], selectionSet: any): any[] => {
    if (!rows.length) return [];

    const selections = parseSelectionSet(selectionSet, '');
    const result = new Map<string, any>();

    rows.forEach(row => {
        // Get parent entity ID
        const parentId = row['id'];
        if (!result.has(parentId)) {
            result.set(parentId, transformSingleResult(row, selectionSet));
        }

        // Handle nested relationships
        selections.forEach(selection => {
            if (selection.type === 'relationship') {
                const parentEntity = result.get(parentId);
                const nestedData = transformNestedRelationship(row, selection);

                if (nestedData) {
                    if (['hasMany', 'manyToMany'].includes(selection.relationshipType)) {
                        parentEntity[selection.field] = parentEntity[selection.field] || [];
                        if (!parentEntity[selection.field].some(item => item.id === nestedData.id)) {
                            parentEntity[selection.field].push(nestedData);
                        }
                    } else {
                        parentEntity[selection.field] = nestedData;
                    }
                }
            }
        });
    });

    return Array.from(result.values());
};

const transformSingleResult = (row: any, selectionSet: any): any => {
    if (!row) return null;

    const result = {};
    const selections = parseSelectionSet(selectionSet, '');

    selections.forEach(selection => {
        if (selection.type === 'scalar') {
            result[selection.field] = row[selection.field];
        } else if (selection.type === 'relationship') {
            // Check if any field in this relationship exists
            const hasRelationshipData = selection.selections.some(
                nestedSelection => row[`${selection.field}_${nestedSelection.field}`] !== null
            );

            if (hasRelationshipData) {
                result[selection.field] = transformNestedRelationship(row, selection);
            } else {
                result[selection.field] = selection.relationshipType === 'hasMany' ? [] : null;
            }
        }
    });

    return result;
};

const transformNestedRelationship = (row: any, relationship: any): any => {
    const result = {};
    let hasData = false;

    relationship.selections.forEach(selection => {
        const fieldKey = `${relationship.field}_${selection.field}`;
        if (row[fieldKey] !== null) {
            hasData = true;
            result[selection.field] = row[fieldKey];
        }
    });

    return hasData ? result : null;
};

const transformAggregateResult = (row: any, selectionSet: any): any => {
    if (!row) return { aggregate: { count: 0 } };

    const result = { aggregate: {} };
    const aggregateSelections = selectionSet.selections[0].selectionSet.selections;

    aggregateSelections.forEach(selection => {
        if (selection.field === 'count') {
            result.aggregate.count = parseInt(row.count);
        } else {
            result.aggregate[selection.field] = {};
            (selection.selections || []).forEach(field => {
                const key = `${selection.field}_${field.name.value}`;
                result.aggregate[selection.field][field.name.value] = parseFloat(row[key]);
            });
        }
    });

    return result;
};

const parseArguments = (args: any[], variables: any = {}): any => {
    if (!args?.length) return {};

    return args.reduce((acc, arg) => {
        const value = arg.value.kind === 'Variable'
            ? variables[arg.value.name.value]
            : arg.value.value;

        acc[arg.name.value] = value;
        return acc;
    }, {});
};

const graphDsql = async (graphqlQuery: string, variables: any = {}): Promise<GraphQLResult> => {
    const ast = parse(graphqlQuery);
    const operation = ast.definitions[0];

    if (!['query', 'mutation'].includes(operation.operation)) {
        throw new Error('Only queries and mutations are supported');
    }

    // Process all selections in parallel
    const results = await Promise.all(
        operation.selectionSet.selections.map(async (selection) => {
            const queryName = selection.name.value;
            const alias = selection.alias?.value || queryName;
            const args = parseArguments(selection.arguments, variables);

            // Generate SQL query
            const sqlQuery = generateSQLQuery(queryName, args, selection.selectionSet);

            // Execute query
            const result = await dsql.query({
                text: sqlQuery.text,
                values: sqlQuery.values
            });

            // Transform result to GraphQL shape and include alias
            return [alias, transformResult(result.rows, queryName, selection.selectionSet)];
        })
    );

    // Combine all results into a single object
    return Object.fromEntries(results);
};

export { graphDsql, SCHEMA };